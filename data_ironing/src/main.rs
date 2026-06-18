mod config;
mod data;

#[macro_use]
mod macros;

use config::{Config, fetch_conf_path};
use data::{Entry, load_codelings, load_test_coverage, save_codelings, save_entries};
use std::fs;

fn main() {
    // FIXME: Config: Derive defaults + add fallback to default
    // Don't call .unwrap(), use fallback to default instead

    let conf: Config = toml::from_str(&fs::read_to_string(fetch_conf_path()).unwrap()).unwrap();

    let data_dir = conf.data;

    // Load all JSON files
    let mut codelings = match load_codelings(format!("{}/codelings.json", data_dir)) {
        Ok(codelings) => codelings,
        // FIXME: Better Errors
        Err(e) => panic!("Failed to load codelings.json: {}", e),
    };

    let coverage_by_file = match load_test_coverage(format!("{}/test_coverage.json", data_dir)) {
        Ok(coverage) => coverage.tests,
        Err(e) => panic!("Failed to load test_coverage.json: {}", e),
    };

    // populate test_coverage json: add the new lines that each test has been found to cover
    // Add a line iff there is overlap between the lines that the test covers and the lines in the
    // codeling
    for (test, file_lines_map) in coverage_by_file {
        // FIXME: don't call unwrap()
        for (file, covered_lines) in file_lines_map {
            // for each codeling, if file matches and lines overlap, add `test`
            for codeling in &mut codelings.codelings {
                if codeling.filename == file {
                    for member in &mut codeling.members {
                        // Check if any covered line falls within the member's line range
                        // Member range is [upper, lower] inclusive
                        let has_overlap = covered_lines
                            .iter()
                            .any(|&line| line >= member.upper && line <= member.lower);
                        // FIXME: remove tests whose coverage has changed to exclude this record
                        if has_overlap {
                            // Add test to member's tests if not already present
                            if !member.tests.contains(&test) {
                                member.tests.push(test.clone());
                            }
                        }
                    }
                }
            }
        }
    }

    // make entries.json file
    let mut ents: Vec<Entry> = Vec::new();

    // FIXME: remove redundant additions
    for codeling in &codelings.codelings {
        let file = &codeling.filename;

        for member in &codeling.members {
            let ent = Entry {
                file: file.clone(),
                bounds: [member.upper, member.lower],
                tests: member.tests.clone(),
            };
            ents.push(ent);
        }
    }

    // FIXME: handle err
    let _ = save_codelings(format!("{}/codelings.json", data_dir), &codelings);
    let _ = save_entries(format!("{}/entries.json", data_dir), &ents);
}
