import mongodb from "./db"
import crypto from "crypto";

let collectionName = "posts"

function Post(name, title, post) {
    this.name = name
    this.title = title
    this.post = post
}

/**
 * 存储一篇文章及相关信息
 * @param callback
 */
Post.prototype.save = function () {
    return new Promise((resolve, reject) => {
        let date = new Date()

        // 存储一篇文章及相关信息
        let time = {
            date: date,
            year: date.getFullYear(),
            month: date.getFullYear() + "-" + (date.getMonth() + 1),
            day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
            minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
        }

        // 要存入数据库的文档
        let post = {
            name: this.name,
            time: time,
            title: this.title,
            post: this.post
        }

        mongodb.then((client) => {
            const collection = client.db().collection(collectionName)
            collection.insertOne(post, {safe: true}).then((res) => {
                resolve(res.ops[0])
            }).catch((err) => {
                reject(err)
            })
        })
    })
}

/**
 * 读取文章信息
 * @param name
 * @param callback
 */
Post.get = (name) => {
    return new Promise((resolve, reject) => {
        mongodb.then((client) => {
            const collection = client.db().collection(collectionName)

            let query = {}
            if (name) {
                query.name = name
            }

            collection.find(query).sort({
                time: -1
            }).toArray().then((res) => {
                resolve(res)
            }).catch((err) => {
                reject(err)
            })
        })
    })
}

export default Post