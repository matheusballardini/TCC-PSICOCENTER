// Acordeão animado do FAQ: só uma pergunta aberta por vez, com altura calculada
// dinamicamente (scrollHeight) pra animação suave funcionar com respostas de tamanhos diferentes.
document.addEventListener('DOMContentLoaded', () => {
    const itens = document.querySelectorAll('.faq-item');

    itens.forEach((item) => {
        const botao = item.querySelector('.faq-pergunta');
        const resposta = item.querySelector('.faq-resposta');

        botao.addEventListener('click', () => {
            const estaAberto = item.classList.contains('aberto');

            // fecha qualquer outra pergunta aberta, pra manter só uma expandida por vez
            itens.forEach((outro) => {
                if (outro !== item && outro.classList.contains('aberto')) {
                    outro.classList.remove('aberto');
                    outro.querySelector('.faq-resposta').style.maxHeight = null;
                }
            });

            if (estaAberto) {
                item.classList.remove('aberto');
                resposta.style.maxHeight = null;
            } else {
                item.classList.add('aberto');
                resposta.style.maxHeight = resposta.scrollHeight + 'px';
            }
        });
    });
});
