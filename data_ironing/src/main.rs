mod config;
mod data;

#[macro_use]
mod macros;

use config::{Config, fetch_conf_path};
use data::{load_codelings, load_entries, load_test_coverage};
use std::fs;

fn main() {
    // FIXME: Config: Derive defaults + add fallback to default
    // Don't call .unwrap(), use fallback to default instead

    let conf: Config = toml::from_str(&fs::read_to_string(fetch_conf_path()).unwrap()).unwrap();

    let data_dir = conf.data;

    // Load all JSON files
    println!("Loading JSON files from {}...", data_dir);

    match load_codelings(format!("{}/codelings.json", data_dir)) {
        Ok(codelings) => {
            println!("Loaded codelings.json");
            println!("  - Found {} codeling(s)", codelings.codelings.len());
            for codeling in &codelings.codelings {
                println!(
                    "    - {}: {} member(s)",
                    codeling.filename,
                    codeling.members.len()
                );
            }
        }
        Err(e) => eprintln!("Failed to load codelings.json: {}", e),
    }

    match load_entries(format!("{}/entries.json", data_dir)) {
        Ok(entries) => {
            println!("Loaded entries.json");
            println!("  - Found {} entries", entries.len());
            for entry in &entries {
                println!(
                    "    - {}: lines {}-{} with {} test(s)",
                    entry.file,
                    entry.bounds[0],
                    entry.bounds[1],
                    entry.tests.len()
                );
            }
        }
        Err(e) => eprintln!("Failed to load entries.json: {}", e),
    }

    match load_test_coverage(format!("{}/test_coverage.json", data_dir)) {
        Ok(coverage) => {
            println!("Loaded test_coverage.json");
            println!("  - Found {} test(s)", coverage.tests.len());
            for (test_name, files) in &coverage.tests {
                let total_lines: usize = files.values().map(|lines| lines.len()).sum();
                println!(
                    "    - {}: {} file(s), {} line(s)",
                    test_name,
                    files.len(),
                    total_lines
                );
            }
        }
        Err(e) => eprintln!("Failed to load test_coverage.json: {}", e),
    }
}
