package com.codebase;

import java.util.LinkedList;
import java.util.stream.Collectors;

import javax.json.Json;
import javax.json.JsonArrayBuilder;
import javax.json.JsonObject;
import javax.json.JsonValue;

public class Record {
    
    public int upper;
    public int lower;
    LinkedList<String> tests;

    public static void has_overlap(Test test, Record record) {
        int high = record.lower;
        int low = record.upper;

        for (int line : test.coverage) {
            if (line >= low && line <= high) {
                record.tests.add(test.name);
                return;
            }
        }
    }

    public void discoverTests(LinkedList<Test> allTests) {
        for (Test test : allTests) {
            if (!tests.contains(test.name)) {
                has_overlap(test, this);
            }
        }
    }

    public JsonObject serialiseToJson() {
        JsonArrayBuilder arrBuilder = Json.createArrayBuilder();
        for (String t : tests) {
            arrBuilder.add(t);
        }
        return Json.createObjectBuilder()
                .add("upper", upper)
                .add("lower", lower)
                .add("tests", arrBuilder)
                .build();
    }

    // deserialise
    public Record(JsonValue val) {
        // val like: 
        // {
        //     "upper" : 2,
        //     "lower" : 5,
        //     "tests" : ["test1", "test2"]
        // }
        this.upper = val.asJsonObject().getInt("upper");
        this.lower = val.asJsonObject().getInt("lower");
        this.tests = val.asJsonObject()
                        .getJsonArray("tests")
                        .stream()
                        .map(a -> a.toString())
                        .collect(Collectors.toCollection(LinkedList::new));

    }
}