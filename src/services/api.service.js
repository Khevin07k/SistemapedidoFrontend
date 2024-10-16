import axios from "axios";
const url_base="http://127.0.0.1:8000/api/";
export function Api() {
    let token = localStorage.getItem('access_token');
    const api = axios.create(
        {
            baseURL: url_base,
            headers: {
                'Accept': 'application/json',
                "Content-Type": 'application/json',
                'Authorization': 'Bearer ' + token,
            }
        }
    );
    api.interceptors.response.use(
        (response)=>{
            return response;
        },
        (error)=>{
            if(error.response.status===401)
            {
                localStorage.removeItem('access_token');
                window.location.href="/login";
            }
            console.log(error);
            return Promise.reject(error);
        }

    )

    return api;
}

