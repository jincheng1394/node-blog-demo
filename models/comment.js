import mongodb from "./db"
import {markdown} from "markdown"

let collectionName = "posts"

function Comment(name, day, title, comment) {
    this.name = name
    this.day = day
    this.title = title
    this.comment = comment
}

/**
 * 存储一条留言信息
 */
Comment.prototype.save = function () {
    return new Promise((resolve, reject) => {
        mongodb.then((client) => {
            const collection = client.db().collection(collectionName)

            collection.updateOne({
                "name": this.name,
                "time.day": this.day,
                "title": this.title
            }, {
                $push: {
                    "comments": this.comment
                }
            }).then((res) => {
                resolve(null)
            }).catch((err) => {
                reject(err)
            })
        })
    })
}

export default Comment