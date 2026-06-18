use serde::{Deserialize, Serialize};
use serde_json;
use std::collections::HashMap;
use std::fs;
use std::path::Path;

/// Represents a codeling member with line bounds and tests
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Member {
    pub upper: usize,
    pub lower: usize,
    pub tests: Vec<String>,
}

/// Represents the complete codelings structure
#[derive(Debug, Serialize, Deserialize)]
pub struct Codelings {
    pub codelings: Vec<Codeling>,
}

/// Represents a single codeling entry
#[derive(Debug, Serialize, Deserialize)]
pub struct Codeling {
    pub filename: String,
    pub members: Vec<Member>,
}

impl Codeling {
    pub fn update_coverage_records(&self) -> () {}
}

/// Represents an entry with file, bounds, and tests
#[derive(Debug, Serialize, Deserialize)]
pub struct Entry {
    pub file: String,
    pub bounds: [usize; 2],
    pub tests: Vec<String>,
}

/// Represents the test coverage mapping
// #[derive(Debug, Serialize, Deserialize)]
#[derive(Debug, Deserialize)]
pub struct TestCoverage {
    // Name: {
    //      File: [lines in file]
    // }
    #[serde(flatten)]
    pub tests: HashMap<String, HashMap<String, Vec<usize>>>,
}

/// Load and deserialize codelings.json
pub fn load_codelings<P: AsRef<Path>>(path: P) -> Result<Codelings, Box<dyn std::error::Error>> {
    let content = fs::read_to_string(path)?;
    let codelings = serde_json::from_str(&content)?;
    Ok(codelings)
}

/// Load and deserialize entries.json
pub fn load_entries<P: AsRef<Path>>(path: P) -> Result<Vec<Entry>, Box<dyn std::error::Error>> {
    let content = fs::read_to_string(path)?;
    let entries = serde_json::from_str(&content)?;
    Ok(entries)
}

/// Load and deserialize test_coverage.json
pub fn load_test_coverage<P: AsRef<Path>>(
    path: P,
) -> Result<TestCoverage, Box<dyn std::error::Error>> {
    let content = fs::read_to_string(path)?;
    let coverage = serde_json::from_str(&content)?;
    Ok(coverage)
}

/// Serialize codelings to JSON string
pub fn serialize_codelings(codelings: &Codelings) -> Result<String, serde_json::Error> {
    serde_json::to_string_pretty(codelings)
}

/// Serialize entries to JSON string
pub fn serialize_entries(entries: &[Entry]) -> Result<String, serde_json::Error> {
    serde_json::to_string_pretty(entries)
}

/// Save codelings to file
pub fn save_codelings<P: AsRef<Path>>(
    path: P,
    codelings: &Codelings,
) -> Result<(), Box<dyn std::error::Error>> {
    let json = serialize_codelings(codelings)?;
    fs::write(path, json)?;
    Ok(())
}

/// Save entries to file
pub fn save_entries<P: AsRef<Path>>(
    path: P,
    entries: &[Entry],
) -> Result<(), Box<dyn std::error::Error>> {
    let json = serialize_entries(entries)?;
    fs::write(path, json)?;
    Ok(())
}
