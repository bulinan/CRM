# AirTeams 前端系统

该项目为 AirTeams 2.0 版本所有前端系统文件，包含所有样式表（CSS）、模版（HTML）和控制程序（Javascript）。在 AirTeams 2.0 版本中，所有的模版都源自于该系统，并不由服务器端处理。服务器仅仅提供基本的 Web Service 和全套 API。所以 AirTeams 前端系统需要自行处理路由、样式和逻辑。

# 基本流程
- 用户访问一个地址，如 http://localhost/dashboard
- 由服务器重定向用户至 http://localhost/index.html
- index.html 加载 base.js 和相关依赖文件
- base.js 进行初始化，发现用户需要访问 http://localhost/dashboard
- base.js 根据路由规则执行 airteams.dashboard_rend() 函数
- airteams.dashboard_rend() 调取相应模版代码，并且将由 API 得到的数据注入其中
- airteams.dashboard_rend() 函数将渲染完毕的模版代码插入到 HTML 中，显示并接受响应

# 代码规范
- 所有与数据模块无关的、需要在界面中显示的组件，以 component 开头，如 `component_window_account_rend`
- 所有与数据模块无关的、不需要在界面中显示的功能性代码，以 bootstrap 开头，如 `bootstrap_loadFileExt`
- 所有与数据模块相关的，无论是否需要在界面中显示，都需要以模块的英文名称开头，并且遵循树形结构

# 树形结构
- 模块 - 事件，如： `dashboard_rend` 理解为加载仪表盘的 index 页面
- 模块 - 页面 - 事件，如： `cases_item_rend` 理解为加载某一个特别事件的详情页面
- 模块 - 页面 - 功能区块 - 事件，如 `dashboard_index_events_rend` 理解为加载仪表盘的 index 页面中的 events 部分

# 其他事项

原则上 AirTeams 不使用第三方产品（无论是CSS/JS/HTML），虽然有些产品的确可以缩短我们的工作耗时，但是亢余代码总是不好的。我们需要的是细心打造一套属于我们自己的框架，不需要多强大、不需要多华丽，只要100%实现需求、0%亢余，就是完美的。
