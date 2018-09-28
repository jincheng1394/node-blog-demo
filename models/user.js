import mongodb from "./db"
import crypto from "crypto";

function User(user) {
    this.name = user.name
    this.password = user.password
    this.email = user.email
    this.openId = user.openId ? user.openId : ""
    this.head = user.head ? user.head : ""
}

/**
 * 存储用户信息
 * @param callback
 */
User.prototype.save = function () {
    return new Promise((resolve, reject) => {
        // 生成密码的md5值
        let password = crypto.createHash('md5').update(this.password).digest('hex')
        let email_MD5 = crypto.createHash('md5').update(this.email.toLowerCase()).digest('hex')
        let head = this.head
        if (this.head === "") {
            head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48"
        }

        // 要存入数据库的用户文档
        let user = {
            name: this.name,
            password: password,
            email: this.email,
            head: head,
            openId: this.openId
        }

        mongodb.then((client) => {
            const collection = client.db().collection('users')
            collection.insertOne(user, {safe: true}).then((res) => {
                resolve(res.ops[0])
            }).catch((err) => {
                reject(err)
            })
        })
    })
}

/**
 * 读取用户信息
 * @param name
 * @param callback
 */
User.get = (name) => {
    return new Promise((resolve, reject) => {
        mongodb.then((client) => {
            const collection = client.db().collection('users')
            collection.findOne({name: name}).then((res) => {
                resolve(res)
            }).catch((err) => {
                reject(err)
            })
        })
    })
}

User.getOpenId = (openId) => {
    return new Promise((resolve, reject) => {
        mongodb.then((client) => {
            const collection = client.db().collection('users')
            collection.findOne({openId: openId}).then((res) => {
                resolve(res)
            }).catch((err) => {
                reject(err)
            })
        })
    })
}
export default User