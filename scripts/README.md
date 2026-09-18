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

`test-wechat-studio.cjs` 把新的 `wechat-studio.js` 和 CSS 注入主页面，验证25项工作台用例（包括局部对象选择、18种模板、48组配色、选中文字标记、单/双图定位、撤销与长图版本）。使用相同 jsdom 依赖运行：

```sh
NODE_PATH="$test_deps/node_modules" node scripts/test-wechat-studio.cjs
```

前一个脚本验证原始页面模块基线，后一个验证挂载工作台扩展后的行为。两者均不能证明浏览器分辨率适配或微信发布兼容性，也没有进行真实模型调用。

## 40套纯排版库（2026-09-17）

2026-09-18追加 `test-wechat-image-sizing.cjs`：9项 DOM/状态/CSS契约验证，遍历40套正文模板确认头图独立、自然比例单图/双图、手动裁切及恢复、横竖方图的自然布局契约，以及头图配色和生成要求不随正文模板变化。浏览器自然尺寸的实际渲染仍需视觉验收。

`import-wechat-layouts.cjs` 将用户提供的本地库编译为可在 file:// 打开的 `wechat-layout-library.js`，保留完整HTML、元数据和SHA256；不修改源目录。更新库后显式执行：

```sh
node scripts/import-wechat-layouts.cjs '/Users/koma/Documents/产品工作/政府侧AI助手/135模板库/纯排版40套'
NODE_PATH="$test_deps/node_modules" node scripts/test-wechat-layouts.cjs
```

新增脚本注入库、适配器与工作台，验证当前主入口69项：40套切换、每批10套、全部段落与图片保留、无占位内容泄漏、真实目录和并列结构、标题/小标题/图注/图片位置、撤销/版本、0/1/2/8张图与长正文、长图流程。旧25项脚本仍验证不加载库的兼容回退，不可代替新69项主入口测试。

`test-wechat-gallery.cjs`：12项版式示意检查，覆盖三栏保留、10套同批、40套真实结构特点、短文案/中性配图、分类分页、原地即时试排、示意素材隔离、头图独立与撤销。DOM验证不代表浏览器像素验收。

2026-09-18增加10项头图用例：两路构图、标题确认、参考图删除、输入失效、撤销/版本恢复、安全转义与诚实的待接入状态。本轮没有调用模型推荐或生图；DOM测试不能代替集成页面像素、分辨率及微信粘贴验收。

## 通知格式（2026-09-18）

`test-product-wording.cjs`：10项完整入口的产品文案检查，覆盖素材、图文、头图、长图、修改与保存，确保流程中没有模型名或接入说明，同时保持“画面待更新”和未确认状态，防止清理文案后误报成功。

公众号照片内叠字新增 `test-wechat-photo-overlay.cjs`：11项主入口集成检查，覆盖最新案例入口、整张照片打底、3种衬底、4种位置、未确认修改拦截、生成要求、撤销、版本恢复及改字后旧艺术字失效。历史案例与排版测试同步改用叠加预览选择器；旧左右拼接结果不再作为主流程验收目标。

`NODE_PATH="$test_deps/node_modules" node scripts/test-notice-format.cjs`：注入主入口全部本地脚本，验证15项会议通知、会议方案、工作通知的结构、字段保留、缺项、切换恢复、正文检查与其他助手隔离。仅 DOM/状态验证，不代替字体与分页视觉验收。
