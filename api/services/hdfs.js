require('dotenv').config();

module.exports = (app) => {

    const axios = require('axios').default;
    axios.defaults.baseURL = process.env.HDFS_URL+":"+process.env.HDFS_PORT+process.env.HDFS_PATH;
    const baseURL = process.env.HDFS_URL+":PORT"+process.env.HDFS_PATH;
    const user = process.env.HDFS_USER;

    const getDatanodeURL = async(file, method, op)=>{
        method = method || "GET";
        op = op || "OPEN";

        return new Promise((resolve, reject) => {
            axios({
                url: file+"?op="+op+"&user.name="+user,
                method: method,
                baseURL: getURL(process.env.HDFS_PORT),
                maxRedirects: 0,
            })
            .then(data=>{
                console.log(data);
            })
            .catch(function (err) {
                console.log(err);
                if(err.response && err.response.status==307){

                    console.log(process.env.HDFS_USING_TUNNEL);

                    if(process.env.HDFS_USING_TUNNEL=="true"){

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
                        resolve(err.response.headers.location);
                    }
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


    return {
        listFolder,
        fileStatus,
        getFile,
        getAudioUrl,
        saveFile
    };

};
