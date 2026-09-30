// Carrega as cidades de um estado via API pública do IBGE, pra alimentar um
// <select> de cidade que depende do <select> de estado já escolhido.
const CACHE_CIDADES_POR_ESTADO = {};

async function buscarCidadesDoEstado(uf) {
    if (!uf) return [];
    if (CACHE_CIDADES_POR_ESTADO[uf]) return CACHE_CIDADES_POR_ESTADO[uf];

    const resp = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
    if (!resp.ok) throw new Error('Falha ao buscar cidades do IBGE');
    const dados = await resp.json();
    const nomes = dados.map((municipio) => municipio.nome);
    CACHE_CIDADES_POR_ESTADO[uf] = nomes;
    return nomes;
}

function preencherSelectCidades(selectCidade, cidades, cidadeSelecionada) {
    selectCidade.innerHTML = '';

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = cidades.length ? 'Cidade' : 'Selecione um estado primeiro';
    selectCidade.appendChild(placeholder);

    cidades.forEach((nome) => {
        const opt = document.createElement('option');
        opt.value = nome;
        opt.textContent = nome;
        selectCidade.appendChild(opt);
    });

    selectCidade.disabled = cidades.length === 0;
    if (cidadeSelecionada && cidades.includes(cidadeSelecionada)) {
        selectCidade.value = cidadeSelecionada;
    }
}

async function atualizarCidadesDoEstado(selectEstado, selectCidade, cidadeSelecionada) {
    const uf = selectEstado.value;
    if (!uf) {
        preencherSelectCidades(selectCidade, []);
        return;
    }

    selectCidade.disabled = true;
    selectCidade.innerHTML = '<option value="">Carregando cidades...</option>';
    try {
        const cidades = await buscarCidadesDoEstado(uf);
        preencherSelectCidades(selectCidade, cidades, cidadeSelecionada);
    } catch (e) {
        selectCidade.innerHTML = '<option value="">Não foi possível carregar as cidades</option>';
    }
}

// liga o select de estado a um select de cidade: toda vez que o estado muda,
// recarrega as cidades daquele estado
function ligarEstadoCidade(selectEstado, selectCidade) {
    if (!selectEstado || !selectCidade) return;
    selectCidade.disabled = true;
    selectEstado.addEventListener('change', () => atualizarCidadesDoEstado(selectEstado, selectCidade));
}

// busca rua/bairro/cidade/estado a partir de um CEP via API pública ViaCEP
async function buscarEnderecoPorCep(cep) {
    const cepLimpo = (cep || '').replace(/\D/g, '');
    if (cepLimpo.length !== 8) return null;

    const resp = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    if (!resp.ok) throw new Error('Falha ao buscar o CEP');
    const dados = await resp.json();
    if (dados.erro) return null;

    return {
        logradouro: dados.logradouro || '',
        bairro: dados.bairro || '',
        cidade: dados.localidade || '',
        estado: dados.uf || '',
    };
}

// liga um campo de CEP aos selects de estado/cidade e ao campo de endereço:
// ao completar os 8 dígitos, busca e preenche tudo automaticamente
function ligarCepEndereco(inputCep, selectEstado, selectCidade, inputEndereco) {
    if (!inputCep) return;
    inputCep.addEventListener('blur', async () => {
        try {
            const endereco = await buscarEnderecoPorCep(inputCep.value);
            if (!endereco) return;
            if (endereco.estado && selectEstado) {
                selectEstado.value = endereco.estado;
                await atualizarCidadesDoEstado(selectEstado, selectCidade, endereco.cidade);
            }
            if (endereco.logradouro && inputEndereco) {
                inputEndereco.value = endereco.logradouro;
            }
        } catch (e) {
            // busca falhou: usuário preenche o endereço manualmente
        }
    });
}
