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
    /**
     * Main entry point for the test mapping application.
     * 
     * OVERVIEW:
     * This program performs two key tasks:
     * 1. Enriches codelings.json with test coverage information from test_coverage.json
     * 2. Generates entries.json from the enriched codelings.json data
     * 
     * The workflow:
     * - Load configuration from config.toml
     * - Read test_coverage.json (maps tests to source code lines)
     * - Read codelings.json (contains code members with line ranges)
     * - Merge coverage data into codelings (each codeling member gets list of tests that cover it)
     * - Write updated codelings.json to output
     * - Generate entries.json by converting codelings data to a flat entry format
     */
    public static void main( String[] args ) {

        // ═══════════════════════════════════════════════════════════════════
        // STEP 1: Get the absolute path to the application root directory
        // ═══════════════════════════════════════════════════════════════════
        // This gets the directory where the JAR is located, then goes up one level
        // to find the project root. This is needed to locate config.toml.
        Path absPath;
        try {
            absPath = Paths.get(
                App.class.getProtectionDomain().getCodeSource().getLocation().toURI()
            ).getParent();
        } catch (URISyntaxException e) {
            e.printStackTrace();
            return;
        }

        // ═══════════════════════════════════════════════════════════════════
        // STEP 2: Load configuration from config.toml
        // ═══════════════════════════════════════════════════════════════════
        // FIXME: change the path here (currently goes up two directories)
        // The config file contains paths to data directories
        Path confPath = Paths.get(absPath.toString(), "../../config.toml");
        File initialFile = new File(confPath.toString());

        Toml toml = new Toml().read(initialFile);
        String datapath = toml.getString("data");              // Source data directory
        String finalDatapath = toml.getString("final_data");   // Output data directory

        // ═══════════════════════════════════════════════════════════════════
        // STEP 3: Parse test_coverage.json
        // ═══════════════════════════════════════════════════════════════════
        // Structure: { "test_name": { "file_path": [line_numbers], ... }, ... }
        // IMPACT ON JSON: This data will be cross-referenced to find which tests
        // cover each code member. Results are added to codelings.json.
        JsonObject JSON_line_by_line_test_coverage;
        try {
            JSON_line_by_line_test_coverage = parseWithStreamingParser(datapath+"test_coverage.json");
        } catch (IOException e) {
            e.printStackTrace();
            return;
        }

        // ═══════════════════════════════════════════════════════════════════
        // STEP 4: Parse codelings.json
        // ═══════════════════════════════════════════════════════════════════
        // Structure: { "codelings": [{ "filename": "...", "members": [...] }, ...] }
        // Each member has "upper" and "lower" line numbers defining its bounds
        // IMPACT ON JSON: This will be enriched with test data and written back out
        JsonObject JSON_stored_codelings;
        try {
            JSON_stored_codelings = parseWithStreamingParser(datapath+"codelings.json");
        } catch (IOException e) {
            e.printStackTrace();
            return;
        }

        // ═══════════════════════════════════════════════════════════════════
        // STEP 5: Build in-memory Test objects from coverage data
        // ═══════════════════════════════════════════════════════════════════
        // Convert test_coverage.json into a list of Test objects
        // Each Test contains: test name and a map of (file -> list of covered lines)
        // IMPACT ON JSON: This intermediate data structure will be used to match
        // which tests cover each code member's line range
        LinkedList<Test> allTests = new LinkedList<>();

        // Iterate over each test in the coverage file
        for (String testName : JSON_line_by_line_test_coverage.keySet()) {

            // For each test, get its coverage across all files
            JsonObject fileCoverage = JSON_line_by_line_test_coverage.getJsonObject(testName);

            // Build a map of file -> list of line numbers covered by this test
            Map<String, LinkedList<Integer>> coverage = new HashMap<>();

            for (String fileName : fileCoverage.keySet()) {
                // Convert JSON array of line numbers into a LinkedList of integers
                LinkedList<Integer> lines = fileCoverage.getJsonArray(fileName)
                    .stream()
                    .map(v -> Integer.parseInt(v.toString()))
                    .collect(Collectors.toCollection(LinkedList::new));
                coverage.put(fileName, lines);
            }

            // Create Test object and add to collection
            Test test = new Test(testName, coverage);
            allTests.add(test);
        }

        // ═══════════════════════════════════════════════════════════════════
        // STEP 6: Enrich codelings with test coverage data
        // ═══════════════════════════════════════════════════════════════════
        // This is the core data transformation:
        // 1. Parse each codeling JSON object into a Codeling Java object
        // 2. For each Codeling, call update_records(allTests) to determine which
        //    tests cover its members' line ranges
        // 3. Serialize the enriched Codelings back to JSON
        // 
        // IMPACT ON JSON: Each codeling member will now have a "tests" field
        // containing the list of test names that cover that code member's lines
        JsonArrayBuilder arrBuilder = Json.createArrayBuilder();

        JSON_stored_codelings.getJsonArray("codelings")
                                            .stream()
                                            // Convert JSON to Codeling object
                                            .map(a -> new Codeling(a.asJsonObject()))
                                            // Add test coverage data to each codeling
                                            .map(a -> {a.update_records(allTests); return a;})
                                            // Serialize back to JSON and collect in builder
                                            .forEach(a -> arrBuilder.add(a.serialiseToJson()));

        // Create the updated JSON structure with enriched codelings
        JsonObject updatedJson = Json.createObjectBuilder()
                .add("codelings", arrBuilder)
                .build();

        // ═══════════════════════════════════════════════════════════════════
        // STEP 7: Write enriched codelings.json to output
        // ═══════════════════════════════════════════════════════════════════
        // IMPACT ON JSON: The enriched codelings.json file is created with
        // test coverage information added to each member
        try {
            Files.write(Paths.get(finalDatapath + "codelings.json"), updatedJson.toString().getBytes());
        } catch (IOException e) {
            e.printStackTrace();
        }

        // ═══════════════════════════════════════════════════════════════════
        // STEP 8: Generate entries.json from codelings
        // ═══════════════════════════════════════════════════════════════════
        // This converts the nested codelings structure into a flat entry structure
        // Each entry represents one code member with its bounds and tests
        // 
        // TRANSFORMATION:
        // Input: { "codelings": [{ "filename": "...", "members": [{ "upper": N, "lower": M, "tests": [...] }] }] }
        // Output: [{ "file": "...", "bounds": [N, M], "tests": [...] }, ...]
        // 
        // Note: File paths are converted to be relative to the solutions directory
        String solutionsDir = toml.getString("solutions_dir");
        String entriesFilePath = toml.getString("entries_file");
        Path solutionsPath = Paths.get(solutionsDir);

        JsonArrayBuilder entriesBuilder = Json.createArrayBuilder();

        // Iterate through each codeling
        for (JsonValue val : JSON_stored_codelings.getJsonArray("codelings")) {
            JsonObject codeling = val.asJsonObject();
            String filename = codeling.getString("filename");

            // Convert absolute path to relative path for portability
            String relativeFile = solutionsPath.relativize(Paths.get(filename)).toString();
            JsonArray members = codeling.getJsonArray("members");

            // Each member becomes a separate entry
            for (JsonValue member : members) {

                JsonObject memberObj = member.asJsonObject();
                
		int upper = memberObj.getInt("upper");    // Start line of member
                int lower = memberObj.getInt("lower");    // End line of member
                
		JsonArray tests = memberObj.getJsonArray("tests");  // Tests covering this member

                // Create entry with flattened structure
                entriesBuilder.add(Json.createObjectBuilder()
                    .add("file", relativeFile)
                    .add("bounds", Json.createArrayBuilder()
                        .add(upper)
                        .add(lower))
                    .add("tests", tests));
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // STEP 9: Write entries.json to output
        // ═══════════════════════════════════════════════════════════════════
        // IMPACT ON JSON: A new entries.json file is created with the flattened
        // representation of code members and their test coverage
        try {
            Files.write(Paths.get(entriesFilePath), entriesBuilder.build().toString().getBytes());
        } catch (IOException e) {
            e.printStackTrace();
        }

    }

    public static JsonObject parseWithStreamingParser(String filePath) throws IOException {
 
        Path path = Paths.get(filePath);
 
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
        obj.forEach((key, val) -> {
            System.err.printf("%s : %s\n", key.toString(), val.toString());
        });
    }
}
