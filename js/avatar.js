// Gera um avatar com as iniciais do nome (círculo colorido + iniciais em branco)
// como uma imagem SVG embutida (data URI), pra usar no lugar de uma foto padrão
// genérica sempre que a pessoa não tiver foto de verdade cadastrada.
function initialsAvatarSrc(name) {
    const initials = (name || '?')
        .trim()
        .split(/\s+/)
        .map((parte) => parte[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || '?';

    const cores = ['#2b4391', '#4b6cb7', '#845fb4', '#5568fc', '#004f83', '#0d9488'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
        hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    }
    const cor = cores[hash % cores.length];

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
        <rect width="200" height="200" rx="100" fill="${cor}"/>
        <text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="Arial, sans-serif" font-size="80" font-weight="700" fill="#fff">${initials}</text>
    </svg>`;

    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// devolve a foto de verdade se existir, ou o avatar de iniciais como fallback
function avatarSrc(photo, name) {
    return photo || initialsAvatarSrc(name);
}
