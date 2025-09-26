// app/api/generate-pdf/route.js
import puppeteer from 'puppeteer';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { htmlContent } = await request.json();

    if (!htmlContent) {
      return NextResponse.json({ error: "Missing HTML content" }, { status: 400 });
    }

     const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    });
    const page = await browser.newPage();

    // 💡 THE CRITICAL FIX IS HERE: Inject the styles
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <style>
              /* ======================================================= */
              /* 1. Reset and Base Styles */
              /* ======================================================= */
              body {
                  font-family: ui-sans-serif, system-ui, sans-serif; /* Use a common font stack */
                  margin: 0;
                  padding: 0;
                  background-color: white; /* Ensure white background */
              }

              /* ======================================================= */
              /* 2. Resume Container (The PDF Page Layout) */
              /* ======================================================= */
              .resume-container {
                  /* Set padding/margins for the page content */
                  padding: 15mm; 
                  box-sizing: border-box;
                  min-height: 297mm; /* Ensure A4 height for visual consistency */
                  width: 210mm; /* Ensure A4 width */
                  color: black; /* Ensure text is black */
              }

              /* ======================================================= */
              /* 3. MDEditor / Tailwind Styles (You MUST copy these) */
              /* ======================================================= */
              /* Paste all necessary CSS here. This includes:
                 - Styles for MDEditor.Markdown component (headings, lists, paragraphs)
                 - Tailwind classes like align-center, font-medium, etc.
                 - Any CSS variables or custom utilities your Markdown output uses.
                 
                 Example (you need the real styles):
              */
              h1, h2, h3, h4 { margin-top: 1.5rem; margin-bottom: 0.5rem; }
              h1 { font-size: 2em; }
              h2 { font-size: 1.5em; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
              p { margin-bottom: 1em; line-height: 1.5; }
              
              /* Styles for your custom center alignment */
              [align="center"] { text-align: center; }

              /* Ensure your list styles are applied */
              ul, ol { margin-left: 20px; }
              
          </style>
      </head>
      <body>
          <div class="resume-container">
              ${htmlContent}
          </div>
      </body>
      </html>
    `;

    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

    // 3. Generate the PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true, 
      margin: {
        // Since we're using padding in .resume-container, set Puppeteer margins to 0
        top: '0', 
        right: '0',
        bottom: '0',
        left: '0',
      },
    });

    await browser.close();
    // ... (return response)
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="resume.pdf"',
      },
    });
  } catch (error) {
    console.error('Puppeteer PDF generation failed:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}