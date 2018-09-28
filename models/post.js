import mongodb from "./db"
import {markdown} from "markdown"

let collectionName = "posts"

function Post(name, head, title, tags, post) {
    this.name = name
    this.head = head
    this.title = title
    this.tags = tags
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
            head: this.head,
            time: time,
            title: this.title,
            tags: this.tags,
            post: this.post,
            comments: [],
            reprint_info: {},
            pv: 0
        }
        console.log(post)

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
 * 转载一篇文章
 * @param reprint_from
 * @param reprint_to
 * @returns {Promise<any>}
 */
Post.reprint = (reprint_from, reprint_to) => {
    return new Promise((resolve, reject) => {
        mongodb.then(client => {
            // 找到被转载的文章的原文档
            const collection = client.db().collection(collectionName)

            collection.findOne({
                "name": reprint_from.name,
                "time.day": reprint_from.day,
                "title": reprint_from.title
            }).then(doc => {
                let date = new Date()
                let time = {
                    date: date,
                    year: date.getFullYear(),
                    month: date.getFullYear() + "-" + (date.getMonth() + 1),
                    day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
                    minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
                }

                delete doc._id//注意要删掉原来的 _id
                doc.name = reprint_to.name
                doc.head = reprint_to.head
                doc.time = time
                doc.title = (doc.title.search(/[转载]/) > -1) ? doc.title : "[转载]" + doc.title
                doc.comments = []
                doc.reprint_info = {"reprint_from": reprint_from}
                doc.pv = 0

                // 更新被转载的原文档的 reprint_info 内的 reprint_to
                collection.updateOne({
                    "name": reprint_from.name,
                    "time.day": reprint_from.day,
                    "title": reprint_from.title
                }, {
                    $push: {
                        "reprint_info.reprint_to": {
                            "name": doc.name,
                            "day": time.day,
                            "title": doc.title
                        }
                    }
                }).catch(e => {
                    return reject(e)
                })

                // 将转载生成的副本修改后存入数据库，并返回存储后的文档
                collection.insertOne(doc, {
                    safe: true
                }).then(res => {
                    resolve(res.ops[0])
                }).catch(e => {
                    reject(e)
                })
            }).catch(e => {
                reject(e)
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

            client.db().collection(collectionName).find(query).sort({
                time: -1
            }).limit(10).skip((page - 1) * 10).toArray().then((docs) => {
                // docs.forEach(doc => {
                //     doc.post = markdown.toHTML(doc.post)
                //     if (doc.comments) {
                //         doc.comments.forEach(comment => {
                //             comment.content = markdown.toHTML(comment.content)
                //         })
                //     }
                // })
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

            client.db().collection(collectionName).countDocuments(query).then(res => {
                resolve(res)
            }).catch(e => {
                reject(0)
            })
        })
    })
}

/**
 * 返回所有文章存档信息
 */
Post.getArchive = () => {
    return new Promise((resolve, reject) => {
        mongodb.then(client => {
            client.db().collection(collectionName).find({}, {
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({
                time: -1
            }).toArray().then(docs => {
                resolve(docs)
            }).catch(e => {
                reject(e)
            })
        })
    })
}

/**
 * 返回所有标签
 * @returns {Promise<any>}
 */
Post.getTags = () => {
    return new Promise((resolve, reject) => {
        mongodb.then(client => {
            client.db().collection(collectionName).distinct("tags").then(docs => {
                resolve(docs)
            }).catch(e => {
                reject(e)
            })
        })
    })
}

/**
 * 返回含有特定标签的所有文章
 * @param tag
 * @returns {Promise<any>}
 */
Post.getTag = (tag) => {
    return new Promise((resolve, reject) => {
        mongodb.then(client => {
            client.db().collection(collectionName).find({
                "tags": tag
            }, {
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({
                time: -1
            }).toArray().then(docs => {
                resolve(docs)
            }).catch(e => {
                reject(e)
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
            collection.findOne(query).then((doc) => {
                // 解析 markdown 为 html
                doc.post = markdown.toHTML(doc.post)

                if (doc) {
                    //每访问 1 次，pv 值增加 1
                    collection.updateOne({
                        "name": name,
                        "time.day": day,
                        "title": title
                    }, {
                        $inc: {"pv": 1}
                    })
                }

                resolve(doc)
            }).catch((err) => {
                reject(err)
            })
        })
    })
}

/**
 * 返回通过标题关键字查询的所有文章信息
 * @param keyword
 * @returns {Promise<any>}
 */
Post.search = (keyword) => {
    return new Promise((resolve, reject) => {
        mongodb.then((client) => {
            let pattern = new RegExp(keyword, "i")
            client.db().collection(collectionName).find({
                "title": pattern
            }, {
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({
                time: -1
            }).toArray().then(docs => {
                resolve(docs)
            }).catch(e => {
                reject(e)
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

            //查询要删除的文档
            collection.findOne({
                "name": name,
                "time.day": day,
                "title": title
            }).then(doc => {
                //如果有 reprint_from，即该文章是转载来的，先保存下来 reprint_from
                let reprint_from = "";
                if (doc.reprint_info && doc.reprint_info.reprint_from) {
                    reprint_from = doc.reprint_info.reprint_from;
                }
                if (reprint_from != "") {
                    //更新原文章所在文档的 reprint_to
                    collection.updateOne({
                        "name": reprint_from.name,
                        "time.day": reprint_from.day,
                        "title": reprint_from.title
                    }, {
                        $pull: {
                            "reprint_info.reprint_to": {
                                "name": name,
                                "day": day,
                                "title": title
                            }
                        }
                    })
                }
            })

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