async function testScrape() {
  const catalogUrl = "https://www.letras.mus.br/cancoes-de-tfm/";
  console.log("Fetching index:", catalogUrl);
  const resp = await fetch(catalogUrl, {
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }
  });
  const html = await resp.text();
  
  // Find song links
  const regex = /href="\/cancoes-de-tfm\/([a-z0-9-]+)\/"/gi;
  const matches = [];
  let m;
  while ((m = regex.exec(html))) {
    if (m[1] !== "ouvir" && !matches.includes(m[1])) {
      matches.push(m[1]);
    }
  }

  console.log(`Found ${matches.length} songs in catalog.`);
  console.log("Sample songs:", matches.slice(0, 5));

  if (matches.length > 0) {
    const songUrl = `https://www.letras.mus.br/cancoes-de-tfm/${matches[0]}/`;
    console.log("\nFetching song page:", songUrl);
    const songResp = await fetch(songUrl, {
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      }
    });
    const songHtml = await songResp.text();
    console.log("Song page length:", songHtml.length);

    // Letras.mus.br puts lyrics in div class="lyric-original" or class="lyric"
    const lyricMatch = songHtml.match(/<div class="lyric-original">([\s\S]*?)<\/div>/i) ||
                       songHtml.match(/<div class="cnt-lyric[^"]*">([\s\S]*?)<\/div>/i) ||
                       songHtml.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    
    if (lyricMatch) {
      const rawLyric = lyricMatch[1]
        .replace(/<p>/gi, '')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .trim();
      console.log("=== SAMPLE LYRICS EXTRACTED ===");
      console.log(rawLyric);
    } else {
      console.log("Lyric container match not found. Searching snippet...");
      const pos = songHtml.indexOf("lyric");
      console.log(songHtml.slice(pos, pos + 1000));
    }
  }
}

testScrape().catch(console.error);
