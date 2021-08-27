const Koa = require('koa')
const fs = require('fs')
const path = require('path')
const compilerSfc = require('@vue/compiler-sfc')
const compilerDom = require('@vue/compiler-dom')
const app = new Koa()

/**路径改写 */
function rewriteImport(content){
    return content.replace(/ from ['|"]([^'"]+)['|"]/g, function(s0,s1){
        // console.log('s', s0, s1)
        if(s1[0] !=='.' && s1 !=='./'){
            return ` from '/@modules/${s1}'`;
        }else{
            return s0;
        }
    })
}


app.use(async ctx=>{
    const { url, query } = ctx
    // console.log('url:'+url, '\r\n query:')
    // console.log(query)

    // 首页
    if( url === '/'){
        ctx.type = 'text/html'
        let content = fs.readFileSync('./src/index.html', 'utf-8')
        content = content.replace("<script",
        `<script>
            window.process = {env: {NODE_ENV: 'dev'}}
        </script>
        <script`)

        ctx.body = content
    }
    else if(url.endsWith('.js')){
        // 返回js
        const file = path.join(__dirname, 'src/'+url)
        // console.log(file)
        content = fs.readFileSync(file, 'utf-8')
        ctx.type = 'application/javascript'

        /**
         * 解决；import xx from 'xxx' 
         */ 
        ctx.body = rewriteImport(content)
    }
    else if(url.startsWith('/@modules')){
        // 返回 @/modules
        // vue -> /node_modules/vue/package.json/module

        const prefix = path.resolve(__dirname, 'node_modules' + url.substring(9))
        // console.log('prefix=', prefix)

        const module = require(prefix+'/package.json').module
        // console.log('module=', module)
        const p = path.resolve(prefix, module)
        const content = fs.readFileSync(p,'utf-8')

        ctx.type = 'application/javascript'
        ctx.body = rewriteImport( content )
    }

    /**
     * 编译sfc组件
     * single file component
     * sfc=>script,template=>render
     */
    else if (url.indexOf(".vue") > -1) {
        // /*.vue?type=template
        const p = path.resolve(__dirname, 'src',url.split("?")[0].slice(1));
        // console.log('p=',p)
        const { descriptor } = compilerSfc.parse(fs.readFileSync(p, "utf-8"));
        // console.log("descriptor", descriptor);
        if (!query.type) {
          // 第一步 vue文件 => template script  (compiler-sfc)
          // descriptor.script => js + template生成render部分
          ctx.type = "application/javascript";
          // 借用vue自导的compile框架 解析单文件组件，其实相当于vue-loader做的事情
          ctx.body = `
            ${rewriteImport(
                descriptor.script.content.replace("export default ", "const __script = ")
            )}
            import { render as __render } from "${url}?type=template"
            __script.render = __render
            export default __script
          `;
        } else {
          // 第二步 template模板 => render函数   (compiler-dom)
          const template = descriptor.template;
          const render = compilerDom.compile(template.content, { mode: "module" });
          ctx.type = "application/javascript";
          // console.log('render',render)
          ctx.body = rewriteImport(render.code);
        }
      }
      // css文件
      else if (url.endsWith(".css")) {
        const p = path.resolve(__dirname, 'src', url.slice(1));
        const file = fs.readFileSync(p, "utf-8");
    
        // css 转化为 js代码
        // 利用js 添加一个 style标签
        const content = `
        const css = "${file.replace(/\n/g, "")}"
        let link = document.createElement('style')
        link.setAttribute('type', 'text/css')
        document.head.appendChild(link)
        link.innerHTML = css
        export default css
        `;
        ctx.type = "application/javascript";
        ctx.body = content;
      }
})
app.listen(3000,()=>{
    console.log('server is running at :\r\n http://127.0.0.1:3000')
})