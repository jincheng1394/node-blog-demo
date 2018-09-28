import express from "express"
import UserModel from "../models/user"
import PostModel from "../models/post"
import CommentModel from "../models/Comment"
import util from "util"
import crypto from "crypto"
import fs from 'fs'

let router = express.Router()

/* GET home page. */
router.get('/', async (req, res, next) => {
    let posts = await PostModel.getAll(null)
    if (!posts) {
        posts = []
    }

    res.render('index', {
        title: '主页',
        user: req.session.user,
        posts: posts,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    })
})

router.get('/reg', checkNotLogin)

router.get('/reg', async (req, res, next) => {
    res.render('reg', {
        title: '注册',
        user: req.session.user,
        name: util.format('user%i', parseInt(Math.random() * 10000)),
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    })
})
router.post('/reg', checkNotLogin)
router.post('/reg', async (req, res, next) => {

    let name = req.body.name
    let email = req.body.email
    let password = req.body.password
    let password_re = req.body['password-repeat']

    // 检验用户两次输入的密码是否一致
    if (password_re != password) {
        req.flash('error', '两次输入的密码不一致')
        return res.redirect('/reg')
    }


    let newUser = new UserModel({
        name: name,
        password: password,
        email: email
    })

    // 检查用户名是否已经存在
    let oldUser = await UserModel.get(newUser.name)
    if (oldUser) {
        req.flash('error', '用户已存在！')
        return res.redirect('/reg')
    }

    try {
        // 如果用户名不存在，新增
        let user = await newUser.save()
        req.session.user = user
        req.flash('success', '注册成功')
        res.redirect("/")
    } catch (e) {
        req.flash('error', e)
        return res.redirect("/reg")
    }

})

router.get('/login', checkNotLogin)
router.get('/login', async function (req, res, next) {
    res.render('login', {
        title: '登录',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    })
})

router.post('/login', checkNotLogin)
router.post('/login', async (req, res, next) => {
    // 生成密码的MD5值
    let password = crypto.createHash("md5").update(req.body.password).digest("hex")

    // 检查用户是否存在
    let user = await UserModel.get(req.body.name)
    if (!user) {
        req.flash('error', "用户不存在")
        return res.redirect('/login')
    }

    // 检查密码是否一致
    if (user.password !== password) {
        req.flash('error', "密码错误")
        return res.redirect('/login')
    }

    req.session.user = user
    req.flash('success', "登录成功！")

    return res.redirect('/')
})

router.get('/post', checkLogin)
router.get('/post', async (req, res, next) => {
    res.render('post', {
        title: '发表',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    })
})

router.post('/post', checkLogin)
router.post('/post', async (req, res) => {
    try {
        let currentUser = req.session.user
        let post = new PostModel(currentUser.name, req.body.title, req.body.post)
        post.save()
        req.flash('success', "发布成功")
        res.redirect('/')
    } catch (e) {
        req.flash('error', e)
        res.redirect('/post')
    }
})

router.get("/u/:name", async (req, res) => {
    let user = await UserModel.get(req.params.name)
    if (!user) {
        req.flash('error', '用户不存在！')
        return res.redirect('/') // 用户不存在则跳转到主页
    }

    // 查询并返回该用户的所有文章
    let posts = await PostModel.getAll(user.name)
    res.render('user', {
        title: user.name,
        user: req.session.user,
        posts: posts,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    })

})

router.get("/u/:name/:day/:title", async (req, res) => {
    // 查询并返回该用户的所有文章
    let post = await PostModel.getOne(req.params.name, req.params.day, req.params.title)
    if (!post) {
        req.flash('error', '文章不存在！')
        return res.redirect('/') // 用户不存在则跳转到主页
    }

    res.render('article', {
        title: post.title,
        user: req.session.user,
        post: post,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    })

})

router.post('/u/:name/:day/:title', async (req, res) => {
    let date = new Date()
    let time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    let comment = {
        name: req.body.name,
        email: req.body.email,
        website: req.body.website,
        time: time,
        content: req.body.content
    }
    try {
        let newComment = new CommentModel(req.params.name, req.params.day, req.params.title, comment)
        await newComment.save()
        req.flash('success', '留言成功!')
    } catch (e) {
        req.flash('error', e)

    }

    return res.redirect('back')
})

router.get('/edit/:name/:day/:title', checkLogin)
router.get('/edit/:name/:day/:title', async (req, res) => {
    let currentUser = req.session.user

    let post = await PostModel.edit(currentUser.name, req.params.day, req.params.title)
    if (!post) {
        req.flash('error', "文章不存在")
        return res.redirect('back')
    }

    res.render('edit', {
        title: '编辑',
        post: post,
        user: currentUser,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    })

})

router.post('/edit/:name/:day/:title', checkLogin)
router.post('/edit/:name/:day/:title', async (req, res) => {
    let currentUser = req.session.user
    let url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title)

    try {
        await PostModel.update(currentUser.name, req.params.day, req.params.title, req.body.post)
        req.flash('success', '修改成功!')
        res.redirect(url) //成功！返回文章页
    } catch (e) {
        req.flash('error', e)
        return res.redirect(url) //出错！返回文章页
    }
})

router.get('/remove/:name/:day/:title', checkLogin)
router.get('/remove/:name/:day/:title', async (req, res) => {
    let currentUser = req.session.user
    try {
        await PostModel.remove(currentUser.name, req.params.day, req.params.title)
        req.flash('success', '删除成功!')
        return res.redirect('/')
    } catch (e) {
        req.flash('error', e)
        return res.redirect('back')
    }
})

router.get('/upload', checkLogin)
router.get('/upload', async (req, res) => {
    res.render('upload', {
        title: '文件上传',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    })
})

router.post('/upload', checkLogin)
router.post('/upload', async (req, res) => {
    req.files.forEach(file => {
        console.log(file)
        if (file.size === 0) {
            // 使用同步方式删除一个文件
            fs.unlinkSync(file.path)
            console.log('Successfully removed an empty file!')
        } else {
            let date = new Date()
            // let target_path = `./public/upload/${date.getFullYear()}/${date.getMonth()}/${date.getDay()}/${file.name}`
            let target_path = `./public/upload/${file.filename}`
            // 使用同步方式重命名一个文件
            fs.renameSync(file.path, target_path)
            console.log('Successfully renamed a file!')
        }
    })
    req.flash('success', '文件上传成功!')
    res.redirect('/upload')
})

router.get('/logout', checkLogin)
router.get('/logout', async (req, res, next) => {
    delete req.session.user
    req.flash('success', '登出成功！')
    res.redirect('/')
})

function checkLogin(req, res, next) {
    if (!req.session.user) {
        req.flash('error', '未登录!')
        return res.redirect('/login')
    }
    next()
}

function checkNotLogin(req, res, next) {
    if (req.session.user) {
        req.flash('error', '已登录!')
        return res.redirect('back')//返回之前的页面
    }
    next()
}

module.exports = router
