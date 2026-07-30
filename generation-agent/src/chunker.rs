use std::collections::HashMap;
use std::error::Error;
use std::fs;
use std::path::{Path, PathBuf};
use text_splitter::CodeSplitter;
use walkdir::WalkDir;

use fastembed::TextEmbedding;

const CODE_EXTENSIONS: &[&str] = &[
    "py", "js", "ts", "jsx", "tsx", "rs", "go", "java", "c", "cpp", "h", "hpp", "rb", "swift",
    "kt", "cs", "dart", "lua", "zig",
];

const SKIP_DIRS: &[&str] = &[".git", "node_modules", "target", "__pycache__", ".venv"];

fn discover_code_files(root: &Path) -> Result<Vec<PathBuf>, Box<dyn Error>> {
    let mut files = Vec::new();

    for entry in WalkDir::new(root).into_iter().filter_entry(|e| {
        let name = e.file_name().to_string_lossy();
        !(name.starts_with('.') || name == ".." || SKIP_DIRS.contains(&name.as_ref()))
    }) {
        let entry = entry?;
        if entry.file_type().is_file()
            && let Some(ext) = entry.path().extension()
            && CODE_EXTENSIONS.contains(&ext.to_str().unwrap_or(""))
        {
            files.push(entry.path().to_path_buf());
        }
    }

    Ok(files)
}

// TODO: adapt for multiple languages
fn chunk_code_file(path: &PathBuf, max_characters: usize) -> Result<Vec<String>, Box<dyn Error>> {
    // FIXME: path must be a file and not a directory
    let splitter = CodeSplitter::new(tree_sitter_python::LANGUAGE, max_characters)
        .expect("Invalid tree-sitter language");

    let code = fs::read_to_string(path)?;

    let chunks = splitter
        .chunks(&code)
        .map(|chunk| chunk.to_string())
        .collect();

    Ok(chunks)
}

pub fn chunk_all_files() -> Result<Vec<String>, Box<dyn Error>> {
    let solutions = config::fetch_config().solutions_dir;

    let files = discover_code_files(Path::new(&solutions))?;

    // FIXME: Better Error

    // let file_map: HashMap<String, Vec<String>> = HashMap::new();

    let mut all_chunks = Vec::new();
    for f in &files {
        for c in chunk_code_file(f, 500).unwrap() {
            all_chunks.push(c);
        }
    }

    Ok(all_chunks)
}

pub fn embed_fastembed(chunks: Vec<String>) -> anyhow::Result<Vec<Vec<f32>>> {
    let mut model = TextEmbedding::try_new(Default::default())?;
    let embeddings = model.embed(chunks, None)?;
    Ok(embeddings)
}
