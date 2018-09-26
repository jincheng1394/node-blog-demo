import settings from "../config/settings"
import Mongodb from "mongodb"

export default new Promise((resolve, reject) => {
    Mongodb.MongoClient.connect(settings.url, {useNewUrlParser: true}).then((client) => {
        console.log("Connected to Database Successfully.")
        resolve(client)
    }).catch((error) => {
        console.log("Conntection to database failed.")
        reject(error)
    })
})