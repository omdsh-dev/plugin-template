# DeepSeek Harness 插件模板

[English](README.md) | 中文

面向 ESM Cordis 插件的自包含独立仓库模板。仓库用到的每个源文件、编译器配置、测试夹具、贡献说明、skill 和构建辅助都位于本目录内;每个开发输入都从本仓库根目录以下解析。

普通 npm 依赖从包 registry 解析。DSH 宿主是成品包的运行时消费者,不是源码或构建输入。

## 仓库布局

```text
.
├── .agents/skills/               # 仓库本地插件开发工作流
│   ├── dsh-plugin-development/   # 端到端协调器
│   └── dsh-plugin-*/             # plan、scaffold、implement、compose、test、release 与 Stent 阶段
├── docs/
│   ├── dsh-plugin-contracts.md   # 所有插件 skill 共享的本地契约
│   └── dsh-plugin-stent.md       # Stent hook、行、peer 与证据契约
├── src/
│   ├── README.md                 # 服务与功能模块的增长规则
│   ├── config.ts                 # 可序列化 schema 与解析后的默认值
│   ├── index.ts                  # Loader 面向的函数插件命名空间
│   ├── invariant.ts              # 包自有的 invariant companion
│   └── runtime.ts                # 可 fake 的宿主边界与 Cordis 激活
├── tests/
│   ├── README.md                 # harness、功能测试与快照约定
│   ├── harness.ts                # 共享的真实 Cordis 测试挂载
│   ├── plugin.spec.ts            # Loader 导出与激活测试
│   └── snapshots/
│       └── README.md             # 可选的产品可见 fixture 契约
├── .oxlintrc.json                 # 类型感知的 Oxlint 配置
├── .gitignore                    # 生成产物排除
├── AGENTS.md                     # 仓库本地贡献规则
├── LICENSE                       # 模板许可证
├── README.md                     # 仓库与使用契约
├── cordis.patch.yml              # profile bundle 贡献
├── package.json                  # 导出、peers、dsh.bundle.patch
├── pnpm-lock.yaml                # 可复现的 registry 依赖图
├── pnpm-workspace.yaml           # 包管理器与可选补丁策略
├── tsconfig.json                 # 编译器与类型感知 lint 工程
├── tsdown.config.ts              # 从源码直接构建运行时与声明
└── vitest.config.ts              # 测试运行器配置
```

## 可扩展的源码与测试结构

基线镜像了大型 DSH 插件使用的可扩展一级拆分,同时保持产品行为最小:

- `src/index.ts` 拥有 Loader 命名空间;
- `src/config.ts` 拥有可序列化 schema 与直接调用默认值;
- `src/runtime.ts` 拥有可 fake 的宿主边界与 Cordis 激活;
- `tests/harness.ts` 拥有共享的真实 Cordis 测试挂载;
- 内聚的产品行为按能力命名的 `src/<feature>/` 目录增长;
- 稳定的产品可见期望输出属于 `tests/snapshots/`;
- Stent descriptor 与 profile 组合属于 `cordis.patch.yml`;宿主源码补丁不属于本模板。

Turtle UI 的 chat、components、extension 目录描述的是那个产品,不是 DSH 插件契约。只有新插件真正拥有那些能力时才创建对应的功能目录。本地规则见 `src/README.md`、`tests/README.md` 与 `tests/snapshots/README.md`。

## 创建你的插件

1. 在 `package.json`、`src/index.ts`、`src/config.ts`、`src/runtime.ts`、`src/invariant.ts`、`tests/plugin.spec.ts`、`cordis.patch.yml`、TypeScript 包元数据、`README.md` 与 `AGENTS.md` 中替换包身份。
2. 只在上述身份属主中替换模板包名 `@your-scope/dsh-plugin-template` 和插件 id。不要对 `.agents/skills/` 做全局替换;它的通用示例与标记检查必须保持可复用。
3. 更新 `description`、`LICENSE` 与 `cordis.patch.yml`。
4. 只把实现用到的 DSH 宿主服务加入包契约与组合补丁。源码和构建依赖必须能从本仓库的 `node_modules` 解析。
5. 当包拥有权威事件或可变数据关系时,替换空的 invariant installer。
6. 在 `src/runtime.ts` 实现激活与宿主边界行为,按需把内聚能力移入项目专属的 `src/<feature>/` 目录。保持 `src/index.ts` 只含 Loader 元数据与公共 re-export,并通过 `ctx.effect()`、`ctx.on()` 或 registry disposer 限定注册范围。
7. 保持每个源码、编译器、文档和工程引用路径都在本仓库内。从项目根描述文件,例如 `docs/dsh-plugin-contracts.md`。不要添加本地路径 `link:` 或 `file:` 依赖。
8. 只有当包的公共依赖与分发产物就绪时,才把 `private` 设为 `false`。

不要给函数插件添加 default export。Cordis Loader 会解包 `exports.default ?? exports`;多余的 default export 会丢弃 `inject`、`Config`、`apply` 等命名空间导出。

## 内置开发 skills

DSH 会发现在 `.agents/skills/` 下的仓库本地工作流。完整流程从 [`dsh-plugin-development`](.agents/skills/dsh-plugin-development/SKILL.md) 开始,也可以直接调用某一阶段:

| Skill | 用途 |
|---|---|
| [`dsh-plugin-plan`](.agents/skills/dsh-plugin-plan/SKILL.md) | 决定插件形态、依赖、配置、invariant、组合与证据。 |
| [`dsh-plugin-scaffold`](.agents/skills/dsh-plugin-scaffold/SKILL.md) | 从本模板实例化并基线验证新仓库。 |
| [`dsh-plugin-align`](.agents/skills/dsh-plugin-align/SKILL.md) | 在不替换产品行为的前提下，把非模板仓库迁移到本工具链。 |
| [`dsh-plugin-implement`](.agents/skills/dsh-plugin-implement/SKILL.md) | 实现生命周期安全的 Cordis 行为、元数据、文档与 invariants。 |
| [`dsh-plugin-compose`](.agents/skills/dsh-plugin-compose/SKILL.md) | 把 bundle 安装进隔离 profile 并证明有效激活。 |
| [`dsh-plugin-test`](.agents/skills/dsh-plugin-test/SKILL.md) | 验证 Loader 导出、行为、销毁、组合、快照与产物。 |
| [`dsh-plugin-release`](.agents/skills/dsh-plugin-release/SKILL.md) | 在不隐式发布的前提下检查 packed 或 GitHub Release tarball 分发就绪度。 |
| [`dsh-plugin-stent-contract`](.agents/skills/dsh-plugin-stent-contract/SKILL.md) | 建立 Stent 层模型:peer 契约、启动形态、Stent-required 行与 binding 门禁。 |
| [`dsh-plugin-stent-patch`](.agents/skills/dsh-plugin-stent-patch/SKILL.md) | 编写 Stent descriptor、trusted runtime handler 与浏览器 transform,避开各坑。 |
| [`dsh-plugin-stent-verify`](.agents/skills/dsh-plugin-stent-verify/SKILL.md) | 端到端证明 Stent binding、peer 安装与三态启动矩阵。 |

复制模板时保留这些目录,这样未来扎根于插件仓库的会话能沿用同一工作流。

## 独立开发

所有命令都在本目录运行:

```sh
pnpm install
pnpm run lint
pnpm test
pnpm run build
```

`pnpm install` 只解析本包声明的依赖。`lint` 使用启用类型感知分析的 Oxlint 并拒绝警告,检查配置的源码与测试工程。`build` 直接从 `src/` 编译 host entry,向 `lib/` 输出可直接打包的运行时 JavaScript 与声明,不运行安装期 lifecycle build。

release 产物在打包前从 `src/` 构建。profile 或 consumer 安装消费现成的 `lib/` 输出，不运行 `prepare`；使用 `pnpm pack --dry-run --json` 检查最终归档内容。

## CI

模板自带两个 GitHub Actions 工作流:

- `.github/workflows/ci.yml` — 每次推送到 `main` 与每个 pull request:冻结 lockfile 安装、Oxlint 静态分析、测试与构建。
- `.github/workflows/release.yml` — 每次推送到 `main`:执行 Oxlint、测试、构建，打包现成 tarball(`pnpm pack`)，发布到以 `package.json` 的版本号命名的 GitHub Release(`v<version>`)。提升 `version` 即发布新版本;同版本再次推送会刷新该 Release 的产物。

## Profile 激活

包 manifest 声明 bundle 补丁:

```json
{
  "dsh": {
    "bundle": {
      "patch": "./cordis.patch.yml"
    }
  }
}
```

DSH 宿主可以把本包安装进 profile,并用 `cordis.patch.yml` 覆盖自身的运行时组合。该宿主集成刻意位于本仓库的构建与测试输入之外。补丁只组合插件;它不修改宿主源码、编译器设置、构建脚本或 catalog。

invariant companion 通过窄本地接口使用宿主的 `invariants` 服务。这让包构建不依赖宿主私有源码包,同时保留 DSH profile 使用的运行时注册。

## 插件形态

本模板演示函数插件,因此使用命名导出:

```ts
// src/index.ts
export const name = 'plugin-template'
export const inject: string[] = []
export { Config } from './config.ts'
export { apply } from './runtime.ts'

// src/config.ts
export interface Config { /* 可序列化字段 */ }
export const Config: z<Config> = z.object({ /* 校验与默认值 */ })

// src/runtime.ts
export function apply(ctx: Context, config: Config): void { /* effects */ }
```

服务提供者通常改为 default-export 它的 `Service` 子类。两种形态不要混用。

## 分发检查

在考虑 packed 或 GitHub Release 分发前，构建并检查最终归档:

```sh
pnpm run lint
pnpm test
pnpm run build
pnpm pack --dry-run --json
```

最终包必须包含 `main`、`types`、`exports` 与 `files` 命名的每个运行时与声明文件。在包的 DSH 宿主 peers 通过所选分发通道可用之前,保持 `private: true`。

## 测试指引

自带测试证明 Loader 安全的 ESM 导出与 schema 解析后的激活。把激活断言替换为对每个 registry 贡献的可观察行为与销毁断言。产品可见插件应在消费它的 DSH 应用中添加真实 Loader/profile 组合测试,而不是只依赖手工挂载的单元测试。
