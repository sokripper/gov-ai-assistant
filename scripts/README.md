# 静态原型回归

`test-prototype-interactions.cjs` 使用 jsdom 30.0.1，在 Node.js 内执行静态原型与 DOM 事件。不启动浏览器、不加载外部资源、不调用模型。

建议将 jsdom 安装到临时目录，然后运行（在项目根目录执行）：

```sh
test_deps=$(mktemp -d /tmp/gov-demo-tests.XXXXXX)
npm install --prefix "$test_deps" --no-audit --no-fund jsdom@30.0.1
NODE_PATH="$test_deps/node_modules" node scripts/test-prototype-interactions.cjs
```

用例覆盖素材删除/撤销/排序/上限、标题与长图版本一致性、文件工具隔离、表单保留、生成取消、队列取消、复制回退及核心业务交接。计时器在测试中缩短；不能以测试时延评估真实模型性能。

jsdom 不提供实际排版渲染。发布后仍需在浏览器检查响应式布局、滚动、拖放、真实文件选择器与系统剪贴板权限。
