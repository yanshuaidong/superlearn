# PDF文本提取工具（OCR版本）
# 将PDF转为图片后用OCR识别文字

import os
from pdf2image import convert_from_path
import pytesseract

def pdf_to_markdown_ocr(pdf_path, output_path=None):
    """
    使用OCR从PDF提取文本并保存为Markdown文件
    """
    if output_path is None:
        output_path = os.path.splitext(pdf_path)[0] + '.md'
    
    print(f"正在处理: {pdf_path}")
    print("正在将PDF转换为图片（可能需要一点时间）...")
    
    # PDF转图片，dpi越高识别越准但越慢
    images = convert_from_path(pdf_path, dpi=200)
    total_pages = len(images)
    print(f"共 {total_pages} 页")
    
    all_text = []
    
    for i, image in enumerate(images):
        print(f"正在识别第 {i + 1}/{total_pages} 页...")
        # chi_sim=简体中文, eng=英文
        text = pytesseract.image_to_string(image, lang='chi_sim+eng')
        if text.strip():
            all_text.append(f"<!-- 第 {i + 1} 页 -->\n\n{text}")
    
    final_text = "\n\n---\n\n".join(all_text)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(final_text)
    
    print(f"提取完成！已保存到: {output_path}")
    return output_path


if __name__ == "__main__":
    pdf_file = "明代gdp研究.pdf"
    
    if not os.path.exists(pdf_file):
        print(f"错误：找不到文件 {pdf_file}")
    else:
        pdf_to_markdown_ocr(pdf_file)

