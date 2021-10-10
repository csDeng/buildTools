/**
 * 1. 依赖收集
 * 2. ES6 转ES5
 * 3. 替换require exports
 */

const fs = require('fs')
const path = require('path')

// 转换AST语法树
const parser = require('@babel/parser')

// 节点遍历
const traverse = require('@babel/traverse').default

// ES6转ES5
const babel = require('@babel/core')

/** 分析依赖 */
function getModuleInfo(file) {
    const body = fs.readFileSync(file,'utf-8')

    // 转换ast语法树
    const ast = parser.parse(body, {
        sourceType:'module'
    })
    // console.log('ast:\r\n', ast)

    // 依赖收集 {相对路径： 绝对路径}
    const deps = {}

    traverse(ast, {
        /**
         * https://astexplorer.net/
         * 将import a from b 可以看到ImportDeclaration
         * @param {*} param 
         */

        /**
         * 观察者 
         */
        ImportDeclaration( {node} ){
            // console.log('node:\r\n', node)
            const dirname = path.dirname(file)
            const absPath = './' + path.join(dirname, node.source.value)
            deps[node.source.value] = absPath
        }
    })


    // ES6 -> 5
    const {code} = babel.transformFromAst(ast, null,{
        presets: ["@babel/preset-env"]
    })
    const info = {
        file,
        deps,
        code,
    }
    return info;
}

// const info = getModuleInfo('./index.js')

// console.log('info:\r\n', info)

/**
 * 模块解析
 * @param {*} file 
 */
function parserModules( file ){
    const entry = getModuleInfo(file)
    const temp = [entry]

    // 依赖图
    const depGraph = {}

    getDeps(temp, entry)
    temp.forEach(info=>{
        // console.log('temp\r\n', info)
        depGraph[info.file] = {
            deps: info.deps,
            code: info.code
        }
    })

    return depGraph;
}

/**
 * 递归获取依赖
 * @param {*} temp 临时数组，保存依赖关系
 * @param {*} param1 传入一个对象，解构获取里面的deps
 */
function getDeps(temp, {deps}) {
    Object.keys(deps).forEach(key=>{
        const child = getModuleInfo( deps[key] )

        temp.push(child)

        getDeps(temp, child)
    })
}

// console.log( parserModules('./index.js'))



function bundle(file){
    const depsGraph = JSON.stringify( parserModules(file))
    return `
    (function(graph){
        function require(file){
            function absRequire(relPath){
                return require(graph[file].deps[relPath]);
            }
            let exports = {};
            (function(require, exports, code){
                // console.log(code)
                eval(code);
            })(
                absRequire,
                exports,
                graph[file].code
            );
            return exports;
        };
        // 入口
        require( '${file}' ); // require
     })( ${depsGraph} )
    `
};

const content = bundle('./02_src/index.js')
!fs.existsSync('./dist') && fs.mkdirSync('./dist')

fs.writeFileSync('./dist/bundle.js', content)