const dadosDaConversao = {
    cotacoes: [],
    entrada: {
        valor: undefined,
        moeda: undefined,
    },
    saida: {
        moeda: undefined
    }
}

async function receberParametrosDoUsuario() {
    dadosDaConversao.entrada.valor = document.querySelector(".entrada .valor").value
    dadosDaConversao.entrada.moeda = document.querySelector(".entrada .moeda").value
    dadosDaConversao.saida.moeda = document.querySelector(".saida .moeda").value
}

async function carregarDadosDeConversaoDeMoeda() {
    try {
        const url = "https://api2.binance.com/api/v3/ticker/24hr"
        const resposta = await fetch(url)
        const json = await resposta.json()
        fs.writeFileSync(arquivoDoUltimoResultado, JSON.stringify(json, null, 2))
        return json
    } catch (erro) {
        return window.cotacaoDasMoedasPadrao
    }
}

async function receberDadosDasMoedas() {
    if (dadosDaConversao.cotacoes.length > 0) {
        return
    }
    const moedas = await carregarDadosDeConversaoDeMoeda()

    const paraBtc = moedas 
        .filter(cotacao => cotacao.symbol.endsWith("BTC"))
        .map(cotacao => ({
            moeda: cotacao.symbol.substring(0, cotacao.symbol.indexOf("BTC")),
            valor: parseFloat(cotacao.lastPrice)
        }))

    const deBtc = moedas 
        .filter(cotacao => cotacao.symbol.startsWith("BTC"))
        .map(cotacao => ({
            moeda: cotacao.symbol.substring(3),
            valor: 1 / parseFloat(cotacao.lastPrice)
        }))

    dadosDaConversao.cotacoes = [
        ...paraBtc,
        ...deBtc,
    ]
}

async function calcularResultado(params) {
    const valorDeEntrada =  parseFloat(dadosDaConversao.entrada.valor)
    const moedaDeEntrada = (dadosDaConversao.entrada.moeda || "BTC").toUpperCase()
    const moedaDeSaida = (dadosDaConversao.saida.moeda || "USDT").toUpperCase()

    if (isNaN(valorDeEntrada)) {
        console.error(`ERRO: Valor de entrada dever ser numérico.`)
        return
    }    

    const cotacaoDaMoedaDeEntradaParaBtc = moedaDeEntrada === "BTC"
        ? 1
        : dadosDaConversao.cotacoes.find(cotacao => cotacao.moeda === moedaDeEntrada)?.valor    
    if (cotacaoDaMoedaDeEntradaParaBtc === undefined) {
        console.error(`ERRO: Moeda não existe "${moedaDeEntrada}".`)
    }

    const cotacaoDaMoedaDeSaidaParaBtc = moedaDeSaida === "BTC"
        ? 1
        : dadosDaConversao.cotacoes.find(cotacao => cotacao.moeda === moedaDeSaida)?.valor    
    if (cotacaoDaMoedaDeSaidaParaBtc === undefined) {
        console.error(`ERRO: Moeda não existe "${moedaDeSaida}".`)
    }

    if (cotacaoDaMoedaDeEntradaParaBtc === undefined || cotacaoDaMoedaDeSaidaParaBtc === undefined ) {
        return
    }

    const razao = cotacaoDaMoedaDeEntradaParaBtc / cotacaoDaMoedaDeSaidaParaBtc
    const valorDeSaida = valorDeEntrada * razao

    const valorDeEntradaDecimais = moedaDeEntrada.includes("USD") || moedaDeEntrada.includes("BRL") ? 2 : 8
    const valorDeSaidaDecimais = moedaDeSaida.includes("USD") || moedaDeSaida.includes("BRL") ? 2 : 8
    
    document.querySelector(".saida .valor").value = valorDeSaida

}

function preencherMoedasNaLista(select, moedas) {
    const selecao = select.value
    select.innerHTML = ""
    moedas.forEach(moeda => {
        const option = document.createElement("option")
        option.value = moeda
        option.innerHTML = moeda
        select.appendChild(option)
    })
    select.value = selecao
}

function preencherMoedas() {
    let moedas = dadosDaConversao.cotacoes.map(cotacao => cotacao.moeda)
    moedas.push("BTC")
    moedas = moedas.filter(moeda => moeda).sort()

    preencherMoedasNaLista(document.querySelector(".entrada .moeda"), moedas)
    preencherMoedasNaLista(document.querySelector(".saida .moeda"), moedas)
}

async function converter() {
    await receberDadosDasMoedas()
    preencherMoedas()
    await receberParametrosDoUsuario()
    await calcularResultado()
}

converter()