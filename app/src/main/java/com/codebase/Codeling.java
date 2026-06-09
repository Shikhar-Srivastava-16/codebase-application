package com.codebase;

import java.util.LinkedList;
import java.util.stream.Collectors;

import javax.json.Json;
import javax.json.JsonArrayBuilder;
import javax.json.JsonObject;

public class Codeling {
    LinkedList<Record> recordList;

    public void update_records(LinkedList<Test> tests) {
        for (Record rec : this.recordList) {
            rec.discoverTests(tests);
        }
    }

    public JsonObject serialiseToJson() {

        System.err.printf("attempting to serialize: %s\n", this.toString());

        JsonArrayBuilder arrBuilder = Json.createArrayBuilder();
        for (Record r : recordList) {
            arrBuilder.add(r.serialiseToJson());
        }
        return Json.createObjectBuilder()
                .add("members", arrBuilder)
                .build();
    }

    // deserialize
    public Codeling(JsonObject json) {
        this.recordList = json
                            .getJsonArray("members")
                            .stream()
                            .map(a -> new Record(a))
                            .collect(Collectors.toCollection(LinkedList::new));
    }
}
