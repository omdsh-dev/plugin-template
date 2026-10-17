# DeepSeek Harness 插件模板

[English](README.md) | 中文

面向 DeepSeek Harness 0.2.1-rc.2 的 ESM Cordis 插件自包含独立仓库模板。仓库用到的每个源文件、编译器配置、测试夹具、贡献说明、skill 和构建辅助都位于本目录以下。DSH 宿主是成品包的运行时消费者，不是源码或构建输入。

## 文档地图

| 需要 | 阅读 |
| --- | --- |
| 契约规则：插件形态、manifest、依赖、展示、生命周期、组合、client、分发 | [docs/dsh-plugin-contracts.md](docs/dsh-plugin-contracts.md) |
| 端到端工作流与阶段路由 | [.agents/skills/dsh-plugin-development/SKILL.md](.agents/skills/dsh-plugin-development/SKILL.md) |
| 源码、测试与补丁布局 | [src/LAYOUT.md](src/LAYOUT.md)、[tests/LAYOUT.md](tests/LAYOUT.md)、[patches/LAYOUT.md](patches/LAYOUT.md) |
| 命令、CI 与发布流程 | 本 README 与 [.github/workflows](.github/workflows) |

## 仓库布局

```text
.
├── .agents/skills/               # 仓库本地插件开发工作流
│   ├── dsh-plugin-development/   # 端到端协调器
│   └── dsh-plugin-*/             # 阶段 skill
├── docs/
│   └── dsh-plugin-contracts.md   # 权威的包与集成契约
├── patches/
│   └── LAYOUT.md                 # 依赖补丁与 DSH host patch 契约
├── scripts/
│   ├── extract-patch.mjs         # host patch 再生成
│   └── patch.sh                  # 幂等的 host patch 应用
├── src/
│   ├── assets/
│   │   ├── icon.svg              # 通过 `./icon` 导出的插件图标
│   │   └── locale/
│   │       ├── en.json           # 展示元数据
│   │       └── zh.json
│   ├── LAYOUT.md                 # 源码模块增长规则
│   ├── config.ts                 # Schemastery schema 与默认值
│   ├── index.ts                  # Loader 面向的函数插件命名空间
│   └── runtime.ts                # 宿主边界与激活
├── tests/
│   ├── LAYOUT.md                 # 测试约定
│   ├── harness.ts                # 共享的真实 Cordis 测试挂载
│   ├── plugin.test.ts            # Loader 与激活测试
│   └── snapshots/
│       └── LAYOUT.md             # 可选的产品可见 fixture
├── .oxlintrc.json                # 类型感知 Oxlint 配置
├── AGENTS.md                     # 贡献者常驻规则与导航
├── cordis.patch.yml              # profile bundle 贡献
├── package.json                  # 导出、peers、engines 与 bundle 元数据
├── pnpm-lock.yaml                # 可复现依赖图
├── pnpm-workspace.yaml           # 包管理器策略
├── tsconfig.json                 # 编译器与类型感知 lint 工程
├── tsdown.config.ts              # 源码到运行时/声明的构建
└── vitest.config.ts              # 测试运行器配置
```

## 包契约

完整契约由 [docs/dsh-plugin-contracts.md](docs/dsh-plugin-contracts.md) 拥有。以下是方向性要点：

- 函数插件以同一个 ESM 命名空间导出 `name`、`inject`、`Config` 和 `apply`，不提供 default export。
- `engines.node` 为 `>=24.0.0`；`engines.dsh` 声明支持的 DSH 范围；`dsh.manifestVersion` 与 `dsh.bundle.patch` 描述公开的 bundle 层。
- Plugin Manager 通过导出的 `./locale/*.json` 与 `./icon` 读取展示元数据。本模板把物理文件放在 `src/assets/` 并列入 `files`。
- `@deepseek-ai/cordis` 与 `@deepseek-ai/schemastery` 是宿主提供的 peer，同时在 `devDependencies` 中供本地检查；详见 [dependencies](docs/dsh-plugin-contracts.md#dependencies)。
- 有浏览器面的包声明 `dsh.client`，并在 `./client` 导出构建后的 bundle。

## 创建你的插件

1. 在 `package.json`、Loader 属主、配置/运行时属主、聚焦测试、bundle 元数据、TypeScript 元数据、两份 README、`AGENTS.md` 与 `src/assets/` 中替换包身份。
2. 选择完整的 npm 包名。它可以是 scoped 或 unscoped；不要默认继承模板的 `@your-scope/dsh-` 前缀。只在身份属主中替换，不要在 `.agents/skills/` 里全局替换。
3. 把 `engines.dsh` 设为实际支持的范围；除非有意采用不同宿主契约，保持 `engines.node` 为 Node 24 LTS 或更高。
4. 更新 `keywords`、`LICENSE`、`cordis.patch.yml` 以及展示标题、描述和图标。
5. 只加入实现实际使用的 DSH 宿主服务；放置每个包时按 [dependencies](docs/dsh-plugin-contracts.md#dependencies) 分类。
6. 在运行时/服务属主中实现激活与宿主边界行为，让注册归插件 fiber 所有，并在测试中证明销毁。
7. 保持每个源码、编译器、文档和工程引用路径都在本仓库内。不要添加 `link:` 或 `file:` 依赖。
8. 只有当包的公共依赖与分发产物就绪时，才把 `private` 设为 `false`。

不要给函数插件添加 default export。Cordis Loader 会解包 `exports.default ?? exports`；多余的 default export 会丢弃 `inject`、`Config` 和 `apply`。

## 内置开发 skills

完整流程从 [`dsh-plugin-development`](.agents/skills/dsh-plugin-development/SKILL.md) 开始，也可以直接调用某一阶段：

| Skill | 用途 |
| --- | --- |
| [plan](.agents/skills/dsh-plugin-plan/SKILL.md) | 决定形态、依赖、配置、兼容性、展示、组合、证据与分发。 |
| [scaffold](.agents/skills/dsh-plugin-scaffold/SKILL.md) | 从模板实例化并基线验证新仓库。 |
| [align](.agents/skills/dsh-plugin-align/SKILL.md) | 在不改变行为的前提下迁移现有仓库到本工具链。 |
| [implement](.agents/skills/dsh-plugin-implement/SKILL.md) | 实现生命周期安全的行为、配置、元数据、文档与测试。 |
| [client](.agents/skills/dsh-plugin-client/SKILL.md) | 添加 `dsh.client` 浏览器面、slot、settings 表单与 ModuleLoader 检查。 |
| [i18n](.agents/skills/dsh-plugin-i18n/SKILL.md) | 用类型化字典与销毁证据本地化浏览器 UI。 |
| [compose](.agents/skills/dsh-plugin-compose/SKILL.md) | 把 bundle 安装进 profile，并证明激活与兼容性。 |
| [test](.agents/skills/dsh-plugin-test/SKILL.md) | 为 Loader、行为、销毁、组合与产物选择最小证据。 |
| [release](.agents/skills/dsh-plugin-release/SKILL.md) | 在不发布的前提下检查 packed、Git 或 npm 发布就绪度。 |

复制模板时保留这些目录。

## 独立开发

在本仓库根目录运行：

```sh
pnpm install
pnpm run lint
pnpm test
pnpm run build
pnpm pack --dry-run --json
```

`lint` 是类型感知的静态分析门；`test` 使用 Vitest `forks` 池，禁止子进程 fork 的受限宿主可在本地运行 `vitest run --pool=threads`；`build` 生成可直接打包的 `lib/` 运行时与声明，不运行安装期构建。

## CI

- [ci.yml](.github/workflows/ci.yml)：冻结安装、lint、测试与构建，覆盖 `main` 推送和 pull request。
- [release.yml](.github/workflows/release.yml)：执行同样检查后打包 tarball，并发布到对应版本的 GitHub Release。

## Profile 激活

通过插件通道安装：

```sh
dsh plugin --profile <profile> add <package-or-tarball>
```

Profile 启动时检查 `engines.dsh`，按 bundle 顺序应用 `dsh.bundle.patch`，并在不激活插件的情况下读取展示元数据。见 [manifest 与兼容性](docs/dsh-plugin-contracts.md#manifest-and-compatibility) 与 [bundle 组合](docs/dsh-plugin-contracts.md#bundle-composition)。

## 插件形态

```ts
export const name = 'plugin-template'
export const inject: string[] = []
export { Config } from './config.ts'
export { apply } from './runtime.ts'

// src/config.ts
import Schema from '@deepseek-ai/schemastery'
export interface PluginConfig { /* 可序列化字段 */ }
export const Config: Schema<PluginConfig> = Schema.object({ /* 校验与默认值 */ })

// src/runtime.ts
export function apply(ctx: Context, config: PluginConfig): void { /* effects */ }
```

`Config` 是 Cordis Loader 校验的 schema 值；`PluginConfig` 是公开的 TypeScript 配置形状。将两者分开命名可以避免声明合并与 `no-redeclare` 的误报。服务提供者改为 default-export 它的 `Service` 子类；两种形态不要混用。

## 分发

打包前先构建并检查归档：

```sh
pnpm run build
pnpm pack --dry-run --json
```

归档必须包含 `main`、`types`、`exports` 与 `files` 承诺的每个文件，以及 bundle patch 与展示资源的物理文件。见 [构建与分发](docs/dsh-plugin-contracts.md#build-and-distribution)。Git 安装获取源码；只有确实要通过这种方式分发时，才添加自包含的 `prepare` 构建，并说明消费方需要授予的构建脚本批准。

## 测试

自带测试证明 Loader 安全的 ESM 导出与 schema 解析后的激活。把激活断言替换为对每个 registry 贡献的可观察行为与销毁断言。产品可见插件还应在消费它的 DSH 应用中添加真实 Loader/profile 组合测试；见 [tests/LAYOUT.md](tests/LAYOUT.md) 与 [证据](docs/dsh-plugin-contracts.md#evidence)。
