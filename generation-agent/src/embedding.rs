use candle_core::{Device, Tensor};
// use candle_nn::VarBuilder;
use candle_transformers::models::bert::BertModel;
use fastembed::TextEmbedding;
// use hf_hub::api::sync::Api;
use std::error::Error;
use tokenizers::tokenizer::Tokenizer;

// Take in a vector of strings and return a vector of Embeddings
// pub fn embed_vec(formulas: Vec<String>) -> Result<Vec<String>, Box<dyn Error>> {
//     let api = Api::new()?;
//     let repo = api.model("BAAI/bge-small-en-v1.5".to_string());
//     let config: Config = serde_json::from_reader(std::fs::File::open(repo.get("config.json")?)?)?;
//     let weights = repo.get("model.safetensors")?;
//
//     // To map back from index to original formula:
//     // fm[n] = embed(data[n])
//     let mut formula_map: Vec<String> = Vec::new();
//     let mut formula_vectors: Vec<f32> = Vec::new();
//
//     let device = Device::Cpu;
//     let tokenizer = Tokenizer::from_file(repo.get("tokenizer.json")?).unwrap();
//     let vb = unsafe {
//         VarBuilder::from_mmaped_safetensors(&[weights], candle_core::DType::F32, &device)?
//     };
//     let model = BertModel::load(vb, &config)?;
//
//     // create embeddings for the entire database
//     for formula_str in &formulas {
//         let vec = embed_bert(&model, &tokenizer, &device, formula_str)?;
//
//         formula_vectors.extend_from_slice(&vec);
//         formula_map.push(formula_str.to_string());
//     }
//
//     Ok()
// }

pub fn embed_fastembed(chunks: Vec<String>) -> anyhow::Result<Vec<Vec<f32>>> {
    let mut model = TextEmbedding::try_new(Default::default())?;
    let embeddings = model.embed(chunks, None)?;
    Ok(embeddings)
}

pub fn embed() {}

fn embed_bert(
    model: &BertModel,
    tokenizer: &Tokenizer,
    device: &Device,
    text: &str,
) -> anyhow::Result<Vec<f32>> {
    let encoding = tokenizer.encode(text, true).unwrap();

    let ids = Tensor::new(encoding.get_ids(), device)?.unsqueeze(0)?;

    let token_types = Tensor::zeros_like(&ids)?;
    let attention = Tensor::ones_like(&ids)?;

    let hidden = model.forward(&ids, &token_types, Some(&attention))?;

    // hidden shape:
    // [batch, sequence, hidden_size]

    let pooled = hidden.mean(1)?;

    let embedding: Vec<f32> = pooled.squeeze(0)?.to_vec1()?;

    Ok(embedding)
}

pub fn embed_tiktoken(
    model: &BertModel,
    tokenizer: &Tokenizer,
    device: &Device,
    text: &str,
) -> anyhow::Result<Vec<f32>> {
    panic!("todo")
}
