import re
import tiktoken
from typing import List, Dict, Any

def chunk_document(content: str, chunk_size: int = 500) -> List[Dict[str, Any]]:
    """
    Splits document content into chunks of approximately chunk_size tokens.
    1. Splits by paragraph (\n) first.
    2. Splits by sentences within paragraphs if needed.
    3. Groups elements to keep token count <= chunk_size while avoiding breaking sentence/paragraph structures.
    Returns list of dicts: {"content": str, "chunk_index": int, "token_count": int}
    """
    if not content:
        return []

    try:
        encoding = tiktoken.get_encoding("cl100k_base")
    except Exception:
        # Fallback to cl100k_base standard
        encoding = tiktoken.encoding_for_model("gpt-4")

    def count_tokens(text: str) -> int:
        return len(encoding.encode(text))

    # Split into lines/paragraphs
    paragraphs = re.split(r'\n+', content)
    text_segments = []

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        
        para_tokens = count_tokens(para)
        if para_tokens <= chunk_size:
            text_segments.append((para, para_tokens, True))  # True = paragraph boundary
        else:
            # Paragraph is too big, split into sentences
            sentences = re.split(r'(?<=[.!?])\s+', para)
            for sentence in sentences:
                sentence = sentence.strip()
                if not sentence:
                    continue
                sent_tokens = count_tokens(sentence)
                text_segments.append((sentence, sent_tokens, False))
            # Mark the last sentence as paragraph boundary
            if text_segments:
                text_segments[-1] = (text_segments[-1][0], text_segments[-1][1], True)

    chunks = []
    current_chunk_texts = []
    current_chunk_tokens = 0
    chunk_idx = 0

    for text, tokens, is_para_boundary in text_segments:
        # If adding this segment exceeds chunk_size, finalize the current chunk
        if current_chunk_tokens + tokens > chunk_size and current_chunk_texts:
            joined_content = "\n".join(current_chunk_texts)
            chunks.append({
                "content": joined_content,
                "chunk_index": chunk_idx,
                "token_count": count_tokens(joined_content)
            })
            chunk_idx += 1
            current_chunk_texts = []
            current_chunk_tokens = 0
            
        current_chunk_texts.append(text)
        current_chunk_tokens += tokens
        
        # If it is a paragraph boundary and we're at a reasonable size, start a new chunk
        if is_para_boundary and current_chunk_tokens >= chunk_size * 0.8:
            joined_content = "\n\n".join(current_chunk_texts)
            chunks.append({
                "content": joined_content,
                "chunk_index": chunk_idx,
                "token_count": count_tokens(joined_content)
            })
            chunk_idx += 1
            current_chunk_texts = []
            current_chunk_tokens = 0

    # Add remaining text
    if current_chunk_texts:
        joined_content = "\n".join(current_chunk_texts)
        chunks.append({
            "content": joined_content,
            "chunk_index": chunk_idx,
            "token_count": count_tokens(joined_content)
        })

    return chunks
