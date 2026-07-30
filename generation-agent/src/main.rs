use faiss::{Index, MetricType, index_factory};
mod chunker;
mod embedding;

use chunker::chunk_all_files;
use embedding::embed_fastembed;
// use chunker::embed_fastembed;

fn main() -> std::result::Result<(), anyhow::Error> {
    // let formulas = chunk_all_files().unwrap();

    let formulas: Vec<String> = vec![
        String::from("E = m*c^2"),
        String::from("F = m*a"),
        String::from("a^2 + b^2 = c^2"),
        String::from(r"x = (-b \pm sqrt(b^2 - 4ac)) / 2a"),
        String::from("sin(x)^2 + cos(x)^2 = 1"),
        String::from("d/dx (x^n) = n*x^(n-1)"),
        String::from("Integral from a to b of f(x) dx"),
        String::from("Sum from n=1 to infinity of 1/n^2 = pi^2/6"),
        String::from("lim x->0 sin(x)/x = 1"),
        String::from("P*V = n*R*T"),
    ];

    let embeddings = embed_fastembed(formulas.clone())?;
    let formula_map = formulas;
    let dimension = embeddings[0].len() as u32;

    // 2. Create a FAISS index
    // Using a Flat index (brute force) with L2 (Euclidean) distance
    // change this to better metric
    let mut index = index_factory(dimension, "Flat", MetricType::L2)?;

    // 3. Add vectors to the index
    let formula_vectors: Vec<f32> = embeddings.iter().flatten().copied().collect();
    index.add(&formula_vectors)?;

    // 4. Define a query formula and vectorize it
    // let query_formula = "Pythagorean theorem: a^2 + b^2 = c^2";
    // let query_formula = "D = S*T";
    let query_formula = "E = m*c^2";
    let query_embedding = embed_fastembed(vec![query_formula.to_string()])?;
    let query_vector = &query_embedding[0];

    // 5. Search for similar formulas
    let k = 3; // Number of nearest neighbors to retrieve
    let search_results = index.search(query_vector, k)?;

    for (i, (label, distance)) in search_results
        .labels
        .iter()
        .zip(search_results.distances.iter())
        .enumerate()
    {
        // The labels returned by FAISS correspond to the original index of the added vectors
        let original_formula_index = label.to_native() as usize;
        if original_formula_index < formula_map.len() {
            println!(
                "  {}. Formula: \"{}\", Distance: {:.4}",
                i + 1,
                formula_map[original_formula_index],
                distance
            );
        } else {
            println!(
                "  {}. Invalid index returned: {}",
                i + 1,
                original_formula_index
            );
        }
    }

    Ok(())
}
