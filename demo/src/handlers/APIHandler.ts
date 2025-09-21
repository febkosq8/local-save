import axios from "axios";
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
axios.defaults.baseURL = process.env.NODE_ENV === "production" ? "https://serve.febkosq8.me" : "http://localhost:3030";
class APIHandler {}
export default APIHandler;
