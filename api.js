const axios = require("axios");

//API data
const url = 'http://eidesite.com:1337';
const mail = "eidemartin_303@hotmail.com";
const password = "GMwUsxmJVYBFM8s";
let APItoken = "";

//LOGIN
module.exports.login = () => {
    return axios
    .post(`${url}/auth/local`, {
        identifier: mail,
        password: password,
    })

    .then(res => {
        APItoken = res.data.jwt;
        console.log('Bot is now connected');
    })

    .catch(err => {
        console.log(err);
    })
}


//GET
module.exports.get = (target, query = '') => {
    return axios
    .get(`${url}/${target}?${query}`, {
        headers: {
            Authorization: `Bearer ${APItoken}`,
        }
    })
    .then(res => {
        return res
    })
    .catch(err => {
        console.log(err.response.data);
    })
}



//PUT
module.exports.put = (target, id, newData) => {
    return axios
    .put(`${url}/${target}/${id}`, newData, {
        headers: {
            Authorization: `Bearer ${APItoken}`,
        }
    })

    .then(res => {
        return res
    })
    .catch(err => {
        console.log(err.response.data);
    })
}

//POST

module.exports.post = (target, newData) => {
    return axios
    .post(`${url}/${target}`, newData, {
        headers: {
            Authorization: `Bearer ${APItoken}`,
        }
    })

    .then(res => {
        return res
    })
    .catch(err => {
        console.log(err.response.data);
    })
}

//DELETE
module.exports.delete = (target, id) => {
    return axios
    .delete(`${url}/${target}/${id}`, {
        headers: {
            Authorization: `Bearer ${APItoken}`,
        }
    })

    .then(res => {
        return res
    })
    .catch(err => {
        console.log(err);
    })
}