// Redimensiona/comprime uma foto no navegador antes de virar base64, pra não
// estourar o limite de tamanho de requisição do Vercel (~4.5MB) nem deixar o
// cadastro/edição de perfil lento com fotos gigantes tiradas de celular.
function comprimirImagem(file, { maxDimensao = 800, qualidade = 0.8 } = {}) {
    return new Promise((resolve, reject) => {
        if (!file || !file.type || !file.type.startsWith('image/')) {
            reject(new Error('Selecione um arquivo de imagem.'));
            return;
        }

        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
        reader.onload = () => {
            const img = new Image();
            img.onerror = () => reject(new Error('Não foi possível processar a imagem.'));
            img.onload = () => {
                let { width, height } = img;
                if (width > maxDimensao || height > maxDimensao) {
                    const escala = maxDimensao / Math.max(width, height);
                    width = Math.round(width * escala);
                    height = Math.round(height * escala);
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                resolve(canvas.toDataURL('image/jpeg', qualidade));
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
}
