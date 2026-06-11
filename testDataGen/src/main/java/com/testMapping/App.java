package com.testMapping;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.Map;
import java.util.stream.Collectors;

import javax.json.Json;
import javax.json.JsonArray;
import javax.json.JsonArrayBuilder;
import javax.json.JsonObject;
import javax.json.JsonValue;
import javax.json.stream.JsonParser;

import com.moandjiezana.toml.Toml;

/**
 * Hello world!
 *
 */
public class App {
    public static void main( String[] args ) {

        // Print Absolute Path of `.`
        Path absPath;
        try {
            absPath = Paths.get(
                App.class.getProtectionDomain().getCodeSource().getLocation().toURI()
            ).getParent();
        } catch (URISyntaxException e) {
            e.printStackTrace();
            return;
        }

        // FIXME: change the path here
        Path confPath = Paths.get(absPath.toString(), "../../config.toml");

        File initialFile = new File(confPath.toString());

        Toml toml = new Toml().read(initialFile);
        String datapath = toml.getString("data");
        String finalDatapath = toml.getString("final_data");

        System.err.printf("Toml Data Directory: %s\n", datapath);

        JsonObject line_by_line_test_coverage;
        try {
            line_by_line_test_coverage = parseWithStreamingParser(datapath+"test_coverage.json");
        } catch (IOException e) {
            System.err.println("====== Error While Parsing Coverage File ======");
            e.printStackTrace();
            return;
        }

        json_pretty(line_by_line_test_coverage);

        JsonObject stored_codelings;
        try {
            stored_codelings = parseWithStreamingParser(datapath+"codelings.json");
        } catch (IOException e) {
            System.err.println("====== Error While Parsing Codeling File ======");
            e.printStackTrace();
            return;
        }

        json_pretty(stored_codelings);

        System.err.println("====== starting now =======");

        LinkedList<Test> allTests = new LinkedList<>();
        for (String testName : line_by_line_test_coverage.keySet()) {
            JsonObject fileCoverage = line_by_line_test_coverage.getJsonObject(testName);
            Map<String, LinkedList<Integer>> coverage = new HashMap<>();
            for (String fileName : fileCoverage.keySet()) {
                LinkedList<Integer> lines = fileCoverage.getJsonArray(fileName)
                    .stream()
                    .map(v -> Integer.parseInt(v.toString()))
                    .collect(Collectors.toCollection(LinkedList::new));
                coverage.put(fileName, lines);
            }
            Test test = new Test(testName, coverage);
            allTests.add(test);
        }

        JsonArrayBuilder arrBuilder = Json.createArrayBuilder();

        // LinkedList<Codeling> codelings = 
        stored_codelings.getJsonArray("codelings")
                                            .stream()
                                            .map(a -> new Codeling(a.asJsonObject()))
                                            .map(a -> {a.update_records(allTests); return a;})
                                            .forEach(a -> arrBuilder.add(a.serialiseToJson()));

        JsonObject updatedJson = Json.createObjectBuilder()
                .add("codelings", arrBuilder)
                .build();

        try {
            Files.write(Paths.get(finalDatapath + "codelings.json"), updatedJson.toString().getBytes());
        } catch (IOException e) {
            System.err.println("====== Error Writing Codelings File ======");
            e.printStackTrace();
        }

        // ── Generate entries.json from codelings ──
        String solutionsDir = toml.getString("solutions_dir");
        String entriesFilePath = toml.getString("entries_file");
        Path solutionsPath = Paths.get(solutionsDir);

        JsonArrayBuilder entriesBuilder = Json.createArrayBuilder();

        for (JsonValue val : stored_codelings.getJsonArray("codelings")) {
            JsonObject codeling = val.asJsonObject();
            String filename = codeling.getString("filename");
            String relativeFile = solutionsPath.relativize(Paths.get(filename)).toString();
            JsonArray members = codeling.getJsonArray("members");

            for (JsonValue member : members) {
                JsonObject memberObj = member.asJsonObject();
                int upper = memberObj.getInt("upper");
                int lower = memberObj.getInt("lower");
                JsonArray tests = memberObj.getJsonArray("tests");

                entriesBuilder.add(Json.createObjectBuilder()
                    .add("file", relativeFile)
                    .add("bounds", Json.createArrayBuilder()
                        .add(upper)
                        .add(lower))
                    .add("tests", tests));
            }
        }

        try {
            Files.write(Paths.get(entriesFilePath), entriesBuilder.build().toString().getBytes());
        } catch (IOException e) {
            System.err.println("====== Error Writing Entries File ======");
            e.printStackTrace();
        }

    }

    public static JsonObject parseWithStreamingParser(String filePath) throws IOException {
 
        Path path = Paths.get(filePath);
        System.err.printf("====== Parsing (JsonParser): %s ======%n", path.getFileName(), Files.size(path) / (1024.0 * 1024.0));
 
        try (
                InputStream is = new BufferedInputStream(Files.newInputStream(path), 64 * 1024);
                JsonParser parser = Json.createParser(is)
            )
        {
            // Advance to the first event
            if (!parser.hasNext()) {
                throw new IllegalArgumentException("Empty JSON file: " + filePath);
            }
 
            JsonParser.Event firstEvent = parser.next();
 
            if (firstEvent != JsonParser.Event.START_OBJECT) {
                throw new IllegalArgumentException("Expected JSON object at root, found: " + firstEvent);
            }
 
            // getObject() reads from the current START_OBJECT event to its
            // matching END_OBJECT, returning a fully populated JsonObject.
            return parser.getObject();
        }
    }

    private static void json_pretty( JsonObject obj ) {
        System.err.println("====== Pretty-Printing Json Object ======");
        obj.forEach((key, val) -> {
            System.err.printf("%s : %s\n", key.toString(), val.toString());
        });
    }
}