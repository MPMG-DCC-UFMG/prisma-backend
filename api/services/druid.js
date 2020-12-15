module.exports = (app) => {

    var Druid = require('druid-query')
        , Client = Druid.Client
        , Query = Druid.Query
        , client = new Client('http://127.0.0.1:8082')

    const timeBoundary = (dataSource) => {

        return new Promise((resolve, reject) => {

            qTime = new Query(client, {
                "queryType": "timeBoundary",
                "dataSource": dataSource,
            });

            qTime.exec(function(err, result){

                if(err) {
                    reject(err);
                } else {
                    resolve(result[0].result.maxTime);
                }
            })

        });
    }

    const timeSeries = (dataSource, interval, options) => {

        options = options || {};

        return new Promise((resolve, reject) => {

            q = new Query(client, {
                "queryType": "timeseries",
                "dataSource": dataSource,
                "granularity": "all",
                "aggregations": options.aggregations,
                "filter": options.filter,
                "intervals": [interval+"/"+interval]
            });

            q.exec(function(err, result){

                if(err) {
                    reject(err);
                } else {
                    resolve(result[0].result);
                }
            })

        });
    }

    const topN = (dimension, dataSource, interval, options) => {

        options = options || {};
        options.threshold = options.threshold || 999;

        if(!options.metric){
            options.metric = {
                type: "dimension",
                ordering: {
                    type: "lexicographic"
                }
            };
        }
        

        return new Promise((resolve, reject) => {

            q = new Query(client, {
                "queryType": "topN",
                "dataSource": dataSource,
                "granularity": "all",
                "dimension": dimension,
                "aggregations": options.aggregations,
                "filter": options.filter,
                "intervals": [interval+"/"+interval],
                "threshold": options.threshold,
                "metric": options.metric,
            });

            q.exec(function(err, result){

                if(err) {
                    reject(err);
                } else {
                    resolve(result[0].result.map(v=>v[dimension]));
                }
            })

        });
    }

    const groupBy = (dataSource, interval, options) => {

        if(!options) options = {};

        return new Promise((resolve, reject) => {
 
            q2 = new Query(client, {
                "queryType": "groupBy",
                "dataSource": dataSource,
                "granularity": "all",
                "dimensions": options.dimensions,
                "filter": options.filter,
                "limitSpec": options.limitSpec,
                "intervals": [interval+"/"+interval]
            });

            q2.exec(function(err, result) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve( result.map(v=>v.event) );
                }
            })

        });

    }

    const scan = (dataSource, interval, options) => {

        if(!options) options = {};

        return new Promise((resolve, reject) => {
 
            q2 = new Query(client, {
                "queryType": "scan",
                "dataSource": dataSource,
                "resultFormat": "list",
                "columns":[],
                "filter": options.filter,
                "limit": options.limit,
                "batchSize":20480,
                "intervals": [interval+"/"+interval]
            });

            q2.exec(function(err, result) {
                if (err) {
                    reject(err);
                }
                else {
                    if(result.length>0)
                        resolve( result[0].events );
                    else 
                        resolve( [] );
                }
            })

        });

    }

    const select = (dataSource, interval, options) => {

        if(!options) options = {};

        return new Promise((resolve, reject) => {
 
            q2 = new Query(client, {
                "queryType": "select",
                "dataSource": dataSource,
                "granularity": "all",
                "dimensions":["cod_meso_regiao", "cod_micro_regiao", "cod_modalidade", "dat_abertura", "dat_edital_convite", "dat_publicacao_edital_do", "dat_publicacao_edital_veiculo_1", "dat_publicacao_edital_veiculo_2", "dat_recebimento_doc", "dsc_objeto", "dsc_objeto_busca", "flag_existe_email_em_comum", "flag_existe_licitante_nao_ativo", "flag_existe_tel_em_comum", "flag_lict_unic_com_venc", "flag_lict_unic_sem_venc", "flag_lograd_comum", "flag_lograd_nro_compl_comum", "flag_lograd_nro_comum", "flag_possui_irregularidade", "flag_socios_comum", "funcoes", "ind_esfera", "metadata_data_execucao_merge", "metadata_trilhas_versao", "nom_comarca", "nom_entidade", "nom_fonte_recurso", "nom_meso_regiao", "nom_micro_regiao", "nom_modalidade", "nom_reg_patrimonio_publico", "num_exercicio", "num_exercicio_licitacao", "num_modalidade", "num_processo_licitatorio", "qtd_cnpjs_envolvidos_socios_comum", "qtd_lograd_comum", "qtd_lograd_nro_compl_comum", "qtd_lograd_nro_comum", "qtd_lograd_sem_compl", "qtd_lograd_sem_nro", "qtd_lograd_sem_nro_e_compl", "qtd_populacao_total", "qtd_socios_comum", "qtde_de_cnpjs_envolvidos_emails", "qtde_de_cnpjs_envolvidos_tels", "qtde_emails_que_repetem", "qtde_licitantes_nao_ativos", "qtde_licitantes_nao_ativos_vencedores", "qtde_tels_que_repetem", "ranking_irregularidades", "seq_dim_entidade", "seq_dim_licitacao", "somatorio_de_emails_repetidos", "somatorio_de_tels_repetidos", "vlr_latitude", "vlr_licitacao", "vlr_longitude"],
                "filter": options.filter,
                "pagingSpec":{"pagingIdentifiers": {}, "threshold":1},
                "intervals": [interval+"/"+interval]
            });

            q2.exec(function(err, result) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve( result );
                }
            })

        });

    }

    return { 
        timeBoundary, 
        timeSeries,
        groupBy,
        scan,
        select,
        topN
    };

};
