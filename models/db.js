import settings from "../config/settings"
import {MongoClient} from "mongodb"

export default new Promise((resolve, reject) => {
    MongoClient.connect(settings.url, {useNewUrlParser: true}).then((client) => {
        console.log("Connected to Database Successfully.")
        resolve(client)
    }).catch((error) => {
        console.log("Conntection to database failed.")
        reject(error)
    })
})