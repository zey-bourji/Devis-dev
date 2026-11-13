// Réduit le logo choisi (max 320 px) et le convertit en PNG.
// Pourquoi : un logo de 4 Mo ne rentrerait pas dans le localStorage et alourdirait le PDF.
export function fileToLogo(file, max = 320) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(new Error("Image illisible"));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("Lecture impossible"));
    reader.readAsDataURL(file);
  });
}

// Cherche la couleur la plus présente dans le logo (en ignorant le blanc, le noir et les gris),
// puis la fonce un peu si besoin pour que le texte blanc reste lisible dessus.
export function dominantColor(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const size = 40;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);

      // On range les pixels dans des "paniers" de couleurs proches, et on garde le panier le plus rempli.
      const buckets = new Map();
      for (let i = 0; i < data.length; i += 4) {
        const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
        if (a < 128) continue; // transparent
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max === 0 ? 0 : (max - min) / max;
        if (saturation < 0.25 || max < 50 || min > 235) continue; // gris, noir ou blanc
        const key = [r, g, b].map((v) => Math.round(v / 32) * 32).join(",");
        const entry = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
        entry.n++;
        entry.r += r;
        entry.g += g;
        entry.b += b;
        buckets.set(key, entry);
      }
      let best = null;
      for (const entry of buckets.values()) if (!best || entry.n > best.n) best = entry;
      if (!best) return resolve(null);

      let [r, g, b] = [best.r / best.n, best.g / best.n, best.b / best.n];
      const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      if (luminance > 0.45) [r, g, b] = [r * 0.65, g * 0.65, b * 0.65];
      const hex = (v) => Math.round(v).toString(16).padStart(2, "0");
      resolve("#" + hex(r) + hex(g) + hex(b));
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}
