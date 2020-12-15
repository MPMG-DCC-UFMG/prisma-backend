module.exports = (app) => {

    const axios = require('axios').default;
    axios.defaults.baseURL = "http://localhost:50070/webhdfs/v1";
    const baseURL = "http://localhost:PORT/webhdfs/v1";
    const user = "ufmg.rdenubila";

    const getDatanodeURL = async(file, method, op)=>{
        method = method || "GET";
        op = op || "OPEN";

        return new Promise((resolve, reject) => {
            axios({
                url: file+"?op="+op+"&user.name="+user,
                method: method,
                baseURL: getURL("50070"),
                maxRedirects: 0,
            })
            .then(data=>{
                console.log(data);
            })
            .catch(function (err) {
                //console.log(err);
                if(err.response && err.response.status==307){

                    console.log(err.response.headers.location);

                    let url = err.response.headers.location.split("webhdfs/v1");
                    let port = 50075;
            
                    if(err.response.headers.location.includes("prod09")) port = 50975;
                    if(err.response.headers.location.includes("prod06")) port = 50675;
                    if(err.response.headers.location.includes("prod05")) port = 50575;
                    if(err.response.headers.location.includes("prod04")) port = 50475;
                    if(err.response.headers.location.includes("prod03")) port = 50375;
                    if(err.response.headers.location.includes("prod02")) port = 50275;
            
                    resolve(getURL(port)+url[1]);
                } else {
                    resolve(null);
                }
                    
            });
        })

    }

    const getURL = (port)=>baseURL.replace("PORT", port);


    const listFolder = (file) => {

        return new Promise((resolve, reject) => {
            axios.get(file+"?op=LISTSTATUS&user.name="+user).then(function (response) {
                resolve(response.data);
            })
            .catch(function (error) {
                reject(error);
            })
        });
    }

    const fileStatus = (file) => {

        return new Promise((resolve, reject) => {
            axios.get(file+"?op=GETFILESTATUS&user.name="+user).then(function (response) {
                resolve(response.data);
            })
            .catch(function (error) {
                resolve(null);
            })
        });
    }

    const getAudioUrl = (file, data) => {

        return new Promise((resolve, reject) => {

            getDatanodeURL(file)
            .then(url=>resolve(url));
                
        });
    }
    

    const getFile = (file, data) => {

        return new Promise((resolve, reject) => {

            getDatanodeURL(file)
            .then(url=>{
                if(url){
                    url = url.replace("overwrite=false", "overwrite=true");
                    axios.get(url, data).then(data=>resolve(data.data));
                } else {
                    resolve(null);
                }
            })
                
        });
    }

    const saveFile = (file, data) => {

        return new Promise((resolve, reject) => {

            getDatanodeURL(file, "PUT", "CREATE")
                .then(url=>{
                    url = url.replace("overwrite=false", "overwrite=true");
                    axios.put(url, data).then(data=>resolve(data.response));
                })
                
        });

    }

    const test = () => {

        return new Promise((resolve, reject) => {

            axios({
                url: "http://localhost:50975/webhdfs/v1/raw_dev/WHATSAPP/audio_140419089430848_us_742f25fb823ecbee071815e4985a2ff5/20201006165139987-audio_140419089430848_us_742f25fb823ecbee071815e4985a2ff5.140419089430848?op=OPEN&user.name=ufmg.rdenubila&namenoderpcaddress=hadoopgsiha&offset=0",
                method: 'GET',
                responseType: 'blob',
            }).then(function (response) {
                console.log("teste");
                resolve(response);
            })
            .catch(function (error) {
                console.log("ERROR");
                reject(error);
            })

        });

    }

    return {
        test,
        listFolder,
        fileStatus,
        getFile,
        getAudioUrl,
        saveFile
    };

};
