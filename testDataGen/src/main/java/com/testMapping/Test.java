package com.testMapping;

import java.util.LinkedList;
import java.util.Map;

public class Test {
    String name;
    Map<String, LinkedList<Integer>> coverage;

    public Test(String name, Map<String, LinkedList<Integer>> coverage) {
        this.name = name;
        this.coverage = coverage;
    }
}
