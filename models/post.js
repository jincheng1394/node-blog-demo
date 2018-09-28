import mongodb from "./db"
import {markdown} from "markdown"

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
            post: this.post,
            comments: []
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
 * 更新一篇文章及其相关信息
 * @param name
 * @param day
 * @param title
 */
Post.update = (name, day, title, post) => {
    return new Promise((resolve, reject) => {
        mongodb.then((client) => {
            // 更新文章内容
            const collection = client.db().collection(collectionName)
            collection.updateOne({
                "name": name,
                "time.day": day,
                "title": title
            }, {
                $set: {post: post}
            }).then((res) => {
                resolve(null)
            }).catch((err) => {
                reject(err)
            })
        })
    })
}

/**
 * 文章列表
 * @param name
 * @returns {Promise<any>}
 */
Post.getAll = (name) => {
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
                res.forEach(doc => {
                    doc.post = markdown.toHTML(doc.post)
                    if (doc.comments) {
                        doc.comments.forEach(comment => {
                            comment.content = markdown.toHTML(comment.content)
                        })
                    }
                })
                resolve(res)
            }).catch((err) => {
                reject(err)
            })
        })
    })
}

/**
 * 一次获取十篇文章
 * @param name
 * @returns {Promise<any>}
 */
Post.getTen = (name, page) => {
    return new Promise((resolve, reject) => {
        mongodb.then((client) => {
            let query = {}
            if (name) {
                query.name = name
            }

            client.db().collection(collectionName).find(query, {
                skip: (page - 1) * 10,
                limit: 10
            }).sort({
                time: -1
            }).toArray().then((docs) => {
                docs.forEach(doc => {
                    doc.post = markdown.toHTML(doc.post)
                    if (doc.comments) {
                        doc.comments.forEach(comment => {
                            comment.content = markdown.toHTML(comment.content)
                        })
                    }
                })
                resolve(docs)
            }).catch((err) => {
                reject(err)
            })
        })
    })
}

/**
 * 获取文章总数
 * @param name
 * @returns {Promise<any>}
 */
Post.getCount = (name) => {
    return new Promise((resolve, reject) => {
        mongodb.then(client => {
            let query = {}
            if (name) {
                query.name = name
            }

            client.db().collection(collectionName).count(query).then(res => {
                resolve(res)
            }).catch(e => {
                reject(0)
            })
        })
    })
}
/**
 * 读取文章信息
 * @param name
 * @param callback
 */
Post.getOne = (name, day, title) => {
    return new Promise((resolve, reject) => {
        mongodb.then((client) => {
            const collection = client.db().collection(collectionName)

            let query = {
                "name": name,
                "time.day": day,
                "title": title
            }
            collection.findOne(query).then((res) => {
                // 解析 markdown 为 html
                res.post = markdown.toHTML(res.post)
                resolve(res)
            }).catch((err) => {
                reject(err)
            })
        })
    })
}

Post.edit = (name, day, title) => {
    return new Promise((resolve, reject) => {
        mongodb.then((client) => {
            const collection = client.db().collection(collectionName)

            let query = {
                "name": name,
                "time.day": day,
                "title": title
            }

            collection.findOne(query).then((res) => {
                resolve(res)
            }).catch((err) => {
                reject(err)
            })
        })
    })
}

/**
 * 删除一篇文章
 * @param name
 * @param day
 * @param title
 * @returns {Promise<any>}
 */
Post.remove = (name, day, title) => {
    return new Promise((resolve, reject) => {
        mongodb.then((client) => {
            const collection = client.db().collection(collectionName)

            // 根据用户名、日期和标题查找并删除一篇文章
            collection.remove({
                "name": name,
                "time.day": day,
                "title": title
            }, {
                w: 1
            }).then(() => {
                resolve(null)
            }).catch((err) => {
                reject(err)
            })
        })
    })
}

export default Post