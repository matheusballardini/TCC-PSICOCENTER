// Modal de confirmação pra excluir conta: só libera o botão depois de digitar
// exatamente "Excluir" no campo, pra evitar clique acidental numa ação irreversível.
// Reaproveita os estilos do modal de avaliação (style/avaliacao.css).
function abrirModalExcluirConta(onConfirmar) {
    const PALAVRA_CONFIRMACAO = 'Excluir';

    const overlay = document.createElement('div');
    overlay.className = 'avaliacao-overlay';
    overlay.innerHTML = `
        <div class="avaliacao-modal">
            <h3>Excluir conta</h3>
            <p>Essa ação não pode ser desfeita. Todos os seus dados, consultas e avaliações serão apagados permanentemente.</p>
            <p>Para confirmar, digite <strong>${PALAVRA_CONFIRMACAO}</strong> abaixo:</p>
            <input type="text" id="confirmarExclusaoInput" placeholder="Digite ${PALAVRA_CONFIRMACAO}" autocomplete="off">
            <p id="confirmarExclusaoErro" class="avaliacao-erro"></p>
            <div class="avaliacao-acoes">
                <button type="button" class="btn-excluir-confirmado" id="confirmarExclusaoBtn" disabled>Excluir conta</button>
                <button type="button" class="btn-secondary" id="confirmarExclusaoCancelarBtn">Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const input = overlay.querySelector('#confirmarExclusaoInput');
    const confirmarBtn = overlay.querySelector('#confirmarExclusaoBtn');
    const erroEl = overlay.querySelector('#confirmarExclusaoErro');

    input.addEventListener('input', () => {
        confirmarBtn.disabled = input.value.trim() !== PALAVRA_CONFIRMACAO;
    });
    input.focus();

    const fechar = () => overlay.remove();
    overlay.querySelector('#confirmarExclusaoCancelarBtn').addEventListener('click', fechar);
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) fechar();
    });

    confirmarBtn.addEventListener('click', async () => {
        if (input.value.trim() !== PALAVRA_CONFIRMACAO) return;
        confirmarBtn.disabled = true;
        confirmarBtn.textContent = 'Excluindo...';
        try {
            await onConfirmar();
            fechar();
        } catch (error) {
            erroEl.textContent = error.message || 'Erro ao excluir conta.';
            confirmarBtn.disabled = false;
            confirmarBtn.textContent = 'Excluir conta';
        }
    });
}
