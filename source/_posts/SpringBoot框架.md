---
title: SpringBoot和MyBatis框架
date: 2026-06-22
cover: /img/covers/SpringBoot框架.jpg
---

# SpringBoot

## 什么是 SpringBoot？

Spring Boot 可以说是 Spring 生态的一个重大突破，它极大地简化了 Spring 应用的开发和部署过程。

以前我们用 Spring 开发项目的时候，需要配置一大堆 XML 文件，包括 Bean 的定义、数据源配置、事务配置等等，非常繁琐。而且还要手动管理各种 jar 包的依赖关系，很容易出现版本冲突的问题。部署的时候还要单独搭建 Tomcat 服务器，整个过程很复杂。Spring Boot 就是为了解决这些痛点而生的。

“约定大于配置”是 Spring Boot 最核心的理念。它预设了很多默认配置，比如默认使用内嵌的 Tomcat 服务器，默认的日志框架是 Logback 等等。这样，我们开发者就只需要关注业务逻辑，不用再纠结于各种配置细节。

自动装配也是 Spring Boot 的一大特色，它会根据项目中引入的依赖自动配置合适的 Bean。比如说，我们引入了 Spring Data JPA，Spring Boot 就会自动配置数据源；比如说，我们引入了 Spring Security，Spring Boot 就会自动配置安全相关的 Bean。

## Spring Boot的常用注解

- `@SpringBootApplication`：这是 Spring Boot 的核心注解，它是一个组合注解，包含了 `@Configuration`、`@EnableAutoConfiguration` 和 `@ComponentScan`。它标志着一个 Spring Boot 应用的入口。
- `@SpringBootTest`：用于测试 Spring Boot 应用的注解，它会加载整个 Spring 上下文，适合集成测试。

## *Spring Boot的自动装配原理

在 Spring Boot 中，开启自动装配的注解是`@EnableAutoConfiguration`。这个注解会告诉 Spring 去扫描所有可用的自动配置类。

![1](/img/SpringBoot和MyBatis框架/1.png)

Spring Boot 为了进一步简化，把这个注解包含到了 `@SpringBootApplication` 注解中。也就是说，当我们在主类上使用 `@SpringBootApplication` 注解时，实际上就已经开启了自动装配。

![1](/img/SpringBoot和MyBatis框架/2.png)

大概可以把 `@SpringBootApplication`看作是 `@Configuration`、`@EnableAutoConfiguration`、`@ComponentScan` 注解的集合。根据 SpringBoot 官网，这三个注解的作用分别是：

- `@EnableAutoConfiguration`：启用 SpringBoot 的自动配置机制
- `@Configuration`：允许在上下文中注册额外的 bean 或导入其他配置类
- `@ComponentScan`：扫描被`@Component` (`@Service`,`@Controller`)注解的 bean，注解默认会扫描启动类所在的包下所有的类 ，可以自定义不扫描某些 bean。如上图所示，容器中将排除`TypeExcludeFilter`和`AutoConfigurationExcludeFilter`。

`EnableAutoConfiguration` 只是一个简单地注解，自动装配核心功能的实现实际是通过 `AutoConfigurationImportSelector`类。

```java
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@AutoConfigurationPackage //作用：将main包下的所有组件注册到容器中
@Import({AutoConfigurationImportSelector.class}) //加载自动装配类 xxxAutoconfiguration
public @interface EnableAutoConfiguration {
    String ENABLED_OVERRIDE_PROPERTY = "spring.boot.enableautoconfiguration";

    Class<?>[] exclude() default {};

    String[] excludeName() default {};
}
```

我们现在重点分析下`AutoConfigurationImportSelector` 类到底做了什么？

`AutoConfigurationImportSelector`类的继承体系如下：



```java
public class AutoConfigurationImportSelector implements DeferredImportSelector, BeanClassLoaderAware, ResourceLoaderAware, BeanFactoryAware, EnvironmentAware, Ordered {

}

public interface DeferredImportSelector extends ImportSelector {

}

public interface ImportSelector {
    String[] selectImports(AnnotationMetadata var1);
}
```

可以看出，`AutoConfigurationImportSelector` 类实现了 `ImportSelector`接口，也就实现了这个接口中的 `selectImports`方法，该方法主要用于**获取所有符合条件的类的全限定类名，这些类需要被加载到 IoC 容器中**。

```java
private static final String[] NO_IMPORTS = new String[0];

public String[] selectImports(AnnotationMetadata annotationMetadata) {
        // <1>.判断自动装配开关是否打开
        if (!this.isEnabled(annotationMetadata)) {
            return NO_IMPORTS;
        } else {
          //<2>.获取所有需要装配的bean
            AutoConfigurationMetadata autoConfigurationMetadata = AutoConfigurationMetadataLoader.loadMetadata(this.beanClassLoader);
            AutoConfigurationImportSelector.AutoConfigurationEntry autoConfigurationEntry = this.getAutoConfigurationEntry(autoConfigurationMetadata, annotationMetadata);
            return StringUtils.toStringArray(autoConfigurationEntry.getConfigurations());
        }
    }
```

这里我们需要重点关注一下`getAutoConfigurationEntry()`方法，这个方法主要负责加载自动配置类的。

![1](/img/SpringBoot和MyBatis框架/3.png)

现在我们结合`getAutoConfigurationEntry()`的源码来详细分析一下：



```java
private static final AutoConfigurationEntry EMPTY_ENTRY = new AutoConfigurationEntry();

AutoConfigurationEntry getAutoConfigurationEntry(AutoConfigurationMetadata autoConfigurationMetadata, AnnotationMetadata annotationMetadata) {
        //<1>.
        if (!this.isEnabled(annotationMetadata)) {
            return EMPTY_ENTRY;
        } else {
            //<2>.
            AnnotationAttributes attributes = this.getAttributes(annotationMetadata);
            //<3>.
            List<String> configurations = this.getCandidateConfigurations(annotationMetadata, attributes);
            //<4>.
            configurations = this.removeDuplicates(configurations);
            Set<String> exclusions = this.getExclusions(annotationMetadata, attributes);
            this.checkExcludedClasses(configurations, exclusions);
            configurations.removeAll(exclusions);
            configurations = this.filter(configurations, autoConfigurationMetadata);
            this.fireAutoConfigurationImportEvents(configurations, exclusions);
            return new AutoConfigurationImportSelector.AutoConfigurationEntry(configurations, exclusions);
        }
    }
```

**第 1 步**:

判断自动装配开关是否打开。默认`spring.boot.enableautoconfiguration=true`，可在 `application.properties` 或 `application.yml` 中设置

**第 2 步**：

用于获取`EnableAutoConfiguration`注解中的 `exclude` 和 `excludeName`。

**第 3 步**

获取需要自动装配的所有配置类，读取`META-INF/spring.factories`

**第 4 步**：

到这里可能面试官会问你:“`spring.factories`中这么多配置，每次启动都要全部加载么？”。

很明显，这是不现实的。

因为，这一步有经历了一遍筛选，`@ConditionalOnXXX` 中的所有条件都满足，该类才会生效。

```java
@Configuration
// 检查相关的类：RabbitTemplate 和 Channel是否存在
// 存在才会加载
@ConditionalOnClass({ RabbitTemplate.class, Channel.class })
@EnableConfigurationProperties(RabbitProperties.class)
@Import(RabbitAnnotationDrivenConfiguration.class)
public class RabbitAutoConfiguration {
}
```

- `@ConditionalOnBean`：当容器里有指定 Bean 的条件下

- `@ConditionalOnMissingBean`：当容器里没有指定 Bean 的情况下

- `@ConditionalOnSingleCandidate`：当指定 Bean 在容器中只有一个，或者虽然有多个但是指定首选 Bean

- `@ConditionalOnClass`：当类路径下有指定类的条件下

- `@ConditionalOnMissingClass`：当类路径下没有指定类的条件下

- `@ConditionalOnProperty`：指定的属性是否有指定的值

- `@ConditionalOnResource`：类路径是否有指定的值

- `@ConditionalOnExpression`：基于 SpEL 表达式作为判断条件

- `@ConditionalOnJava`：基于 Java 版本作为判断条件

- `@ConditionalOnJndi`：在 JNDI 存在的条件下差在指定的位置

- `@ConditionalOnNotWebApplication`：当前项目不是 Web 项目的条件下

- `@ConditionalOnWebApplication`：当前项目是 Web 项 目的条件下

  所以大致流程图便如下

![1](/img/SpringBoot和MyBatis框架/4.png)

**先预加载候选，再用条件筛选，最后按需注册**

## *SpringBoot启动原理是什么？

Spring Boot 的启动主要围绕两个核心展开，一个是 `@SpringBootApplication` 注解，一个是 `SpringApplication.run()` 方法。

@SpringBootApplication上面已经说过

这边说一下SpringApplication.run（）的方法

①、创建 SpringApplication 实例，并识别应用类型，比如说是标准的 Servlet Web 还是响应式的 WebFlux，然后准备监听器和初始化监听容器。

②、创建并准备 ApplicationContext，将主类作为配置源进行加载。

③、刷新 Spring 上下文，触发 Bean 的实例化，比如说扫描并注册 `@ComponentScan` 指定路径下的 Bean。

④、触发自动配置，在 Spring Boot 2.7 及之前是通过 spring.factories 加载的，3.x 是通过读取 `AutoConfiguration.imports`，并结合 `@ConditionalOn` 系列注解依据条件注册 Bean。

⑤、如果引入了 Web 相关依赖，会创建并启动 Tomcat 容器，完成 HTTP 端口监听。

关键的代码逻辑如下：

```
public ConfigurableApplicationContext run(String... args) {
    // 1. 创建启动时的监听器并触发启动事件
    SpringApplicationRunListeners listeners = getRunListeners(args);
    listeners.starting();

    // 2. 准备运行环境
    ConfigurableEnvironment environment = prepareEnvironment(listeners);
    configureIgnoreBeanInfo(environment);

    // 3. 创建上下文
    ConfigurableApplicationContext context = createApplicationContext();

    try {
        // 4. 准备上下文
        prepareContext(context, environment, listeners, args);

        // 5. 刷新上下文，完成 Bean 初始化和装配
        refreshContext(context);

        // 6. 调用运行器
        afterRefresh(context, args);

        // 7. 触发启动完成事件
        listeners.started(context);
    } catch (Exception ex) {
        handleRunFailure(context, ex, listeners);
    }

    return context;
}
```

# MyBatis

## #{} 和 ${} 的区别是什么？

核心区别：

- `#{}` 会变成 SQL 里的 `?` 占位符，由 JDBC 负责传参
- `${}` 会先把变量值直接拼进 SQL 字符串，再执行

**安全性**

- `#{}` 更安全，能防 SQL 注入，平时查询条件基本都该用它
- `${}` 不安全，用户输入如果直接进来，容易 SQL 注入

**适用场景**

- `#{}`：字段值、查询条件、插入值、更新值
- `${}`：表名、列名、排序字段、动态 SQL 片段
  这些地方通常不能用 `?` 占位，只能拼接，但一定要自己做白名单校验

## xml 映射文件中，除了常见的 select、insert、update、delete 标签之外，还有哪些标签？

**基础结构**

- `mapper`：根标签，整个映射文件最外层
- `sql`：定义可复用的 SQL 片段
- `include`：引用 `sql` 片段

例子：

```
<sql id="Base_Column_List">
  id, name, age
</sql>

<select id="findAll" resultType="User">
  select <include refid="Base_Column_List" />
  from user
</select>
```

**结果映射**

- `resultMap`：自定义结果映射
- `id`：主键字段映射
- `result`：普通字段映射
- `association`：一对一对象映射
- `collection`：一对多集合映射
- `constructor`：用构造器封装对象
- `arg`：构造器普通参数
- `idArg`：构造器主键参数
- `discriminator`：鉴别器，类似按字段值决定映射分支
- `case`：配合 `discriminator` 使用

**动态 SQL**

- `if`：条件判断
- `choose`：类似 `switch`
- `when`：`choose` 的分支
- `otherwise`：默认分支
- `where`：自动处理多余 `and` / `or`
- `set`：自动处理更新语句里的逗号
- `trim`：自定义前后缀和要去掉的内容
- `foreach`：遍历集合，常用于 `in`
- `bind`：先绑定一个变量再使用
- `script`：一般多见于注解 SQL 中，也可用于支持脚本式动态 SQL

**主键与缓存**

- `selectKey`：插入前后查询主键
- `cache`：当前 mapper 开启二级缓存
- `cache-ref`：引用别的 mapper 的缓存

**较老或较少用**

- `parameterMap`：老写法，基本已不推荐
- `typeAlias`、`typeHandler` 这类通常更多写在全局配置文件里，不常放在 mapper XML 中

**最值得记住的是这几组**：

1. 复用：`sql`、`include`
2. 结果映射：`resultMap`、`association`、`collection`
3. 动态 SQL：`if`、`where`、`set`、`trim`、`foreach`
4. 其他：`selectKey`、`cache`

## Dao 接口的工作原理是什么？Dao 接口里的方法，参数不同时，方法能重载吗？

最佳实践中，通常一个 xml 映射文件，都会写一个 Dao 接口与之对应。Dao 接口就是人们常说的 `Mapper` 接口，接口的全限名，就是映射文件中的 namespace 的值，接口的方法名，就是映射文件中 `MappedStatement` 的 id 值，接口方法内的参数，就是传递给 sql 的参数。 `Mapper` 接口是没有实现类的，当调用接口方法时，接口全限名+方法名拼接字符串作为 key 值，可唯一定位一个 `MappedStatement` ，举例：`com.mybatis3.mappers. StudentDao.findStudentById` ，可以唯一找到 namespace 为 `com.mybatis3.mappers. StudentDao` 下面 `id = findStudentById` 的 `MappedStatement` 。在 MyBatis 中，每一个 `<select>`、 `<insert>`、 `<update>`、 `<delete>` 标签，都会被解析为一个 `MappedStatement` 对象。

Dao 接口里的方法可以重载，但是 Mybatis 的 xml 里面的 ID 不允许重复。

Mybatis 版本 3.3.0

```java
/**
 * Mapper接口里面方法重载
 */
public interface StuMapper {

 List<Student> getAllStu();

 List<Student> getAllStu(@Param("id") Integer id);
}
```

然后在 `StuMapper.xml` 中利用 Mybatis 的动态 sql 就可以实现。

```xml
<select id="getAllStu" resultType="com.pojo.Student">
  select * from student
  <where>
    <if test="id != null">
      id = #{id}
    </if>
  </where>
</select>
```

**Mybatis 的 Dao 接口可以有多个重载方法，但是多个方法对应的映射必须只有一个，否则启动会报错。**

Dao 接口的工作原理是 JDK 动态代理，MyBatis 运行时会使用 JDK 动态代理为 Dao 接口生成代理 proxy 对象，代理对象 proxy 会拦截接口方法，转而执行 `MappedStatement` 所代表的 sql，然后将 sql 执行结果返回。

Dao 接口方法可以重载，但是需要满足以下条件：

1. 仅有一个无参方法和一个有参方法
2. 多个有参方法时，参数数量必须一致。且使用相同的 `@Param` ，或者使用 `param1` 这种

## MyBatis 是如何进行分页的？分页插件的原理是什么？

**(1)** MyBatis 使用 RowBounds 对象进行分页，它是针对 ResultSet 结果集执行的内存分页，而非物理分页；

**(2)** 可以在 sql 内直接书写带有物理分页的参数来完成物理分页功能，

**(3)** 也可以使用分页插件来完成物理分页。

分页插件的基本原理是使用 MyBatis 提供的插件接口，实现自定义插件，在插件的拦截方法内拦截待执行的 sql，然后重写 sql，根据 dialect 方言，添加对应的物理分页语句和物理分页参数。

举例：`select _ from student` ，拦截 sql 后重写为：`select t._ from （select \* from student）t limit 0，10`

## 简述 MyBatis 的插件运行原理，以及如何编写一个插件

MyBatis 仅可以编写针对 `ParameterHandler`、 `ResultSetHandler`、 `StatementHandler`、 `Executor` 这 4 种接口的插件，MyBatis 使用 JDK 的动态代理，为需要拦截的接口生成代理对象以实现接口方法拦截功能，每当执行这 4 种接口对象的方法时，就会进入拦截方法，具体就是 `InvocationHandler` 的 `invoke()` 方法，当然，只会拦截那些你指定需要拦截的方法。

实现 MyBatis 的 `Interceptor` 接口并复写 `intercept()` 方法，然后在给插件编写注解，指定要拦截哪一个接口的哪些方法即可，记住，别忘了在配置文件中配置你编写的插件

## MyBatis 动态 sql 是做什么的？都有哪些动态 sql？能简述一下动态 sql 的执行原理不？

### 动态 SQL 的作用

它的核心价值在于：

- **提高灵活性**：可以根据不同的输入参数，生成不同的 SQL 语句，适应多变的业务查询需求。
- **提升复用性**：通过 `<sql>` 和 `<include>` 标签，可以定义和复用公共的 SQL 代码片段，减少重复。
- **增强可维护性**：将 SQL 拼接逻辑从 Java 代码转移到 XML 映射文件中，使代码更清晰，也更容易维护和修改。

### 常用动态 SQL 元素

MyBatis 提供了丰富的 XML 标签来实现动态 SQL，它们类似于 Java 中的控制语句。

#### 1. 条件判断与分支

- **`<if>`**：实现简单的条件判断，类似于 Java 的 `if`。当 `test` 条件为 `true` 时，拼接内部的 SQL 片段。
- **`<choose>`, `<when>`, `<otherwise>`**：实现多条件分支选择，类似于 Java 的 `switch-case`。它只会选择第一个满足 `<when>` 条件的 SQL 片段，如果所有条件都不满足，则使用 `<otherwise>`。

#### 2. 关键字与结构处理

- **`<where>`**：用于构建 `WHERE` 子句。它能自动处理第一个条件前的 `AND` 或 `OR`，并在没有条件时自动移除 `WHERE` 关键字，避免 SQL 语法错误。
- **`<set>`**：用于构建 `UPDATE` 语句的 `SET` 子句。它能自动去除最后一个赋值语句后多余的逗号。
- **`<trim>`**：一个更通用的标签，可以自定义地添加或移除 SQL 片段的前缀或后缀，用来实现 `<where>` 和 `<set>` 的功能。

#### 3. 数据遍历与代码复用

- **`<foreach>`**：用于遍历集合（如 List、Set、Array），常用于构建 `IN` 条件或批量插入语句。
- **`<sql>` / `<include>`**：`<sql>` 用于定义可重用的 SQL 片段，而 `<include>` 用于在其他语句中引用这个片段。

###  执行原理简述

MyBatis 动态 SQL 的执行本质是一个 **“解析-生成-执行”** 的过程。

1. **解析阶段（构建 SqlSource）**：在应用启动时，MyBatis 会解析 XML 映射文件，将带有动态标签的 SQL 解析为 `SqlSource` 对象。其中动态标签和文本被解析为 `SqlNode` 对象，形成类似语法树的结构。
2. **生成阶段（获得 BoundSql）**：当 Mapper 方法被调用时，MyBatis 会使用 **OGNL（Object-Graph Navigation Language）** 表达式对传入的参数进行求值，并遍历 `SqlNode` 树，动态决定最终的 SQL 片段。这个过程由 `DynamicSqlSource` 类完成。最终，所有片段拼接成完整的 SQL 语句，并连同参数一起封装成 `BoundSql` 对象。
3. **执行阶段**：MyBatis 通过 JDBC 将 `BoundSql` 中的 SQL 发送给数据库执行，并处理返回的结果集。

总的来说，MyBatis 的动态 SQL 通过将条件逻辑从 Java 代码转移到 XML 配置中，利用 OGNL 表达式在运行时动态生成 SQL，从而实现了高度的灵活性和可维护性。

## MyBatis 是如何将 sql 执行结果封装为目标对象并返回的？都有哪些映射形式？

第一种是使用 `<resultMap>` 标签，逐一定义列名和对象属性名之间的映射关系。第二种是使用 sql 列的别名功能，将列别名书写为对象属性名，比如 T_NAME AS NAME，对象属性名一般是 name，小写，但是列名不区分大小写，MyBatis 会忽略列名大小写，智能找到与之对应对象属性名，你甚至可以写成 T_NAME AS NaMe，MyBatis 一样可以正常工作。

有了列名与属性名的映射关系后，MyBatis 通过反射创建对象，同时使用反射给对象的属性逐一赋值并返回，那些找不到映射关系的属性，是无法完成赋值的。

## MyBatis 是否支持延迟加载？如果支持，它的实现原理是什么？

MyBatis 仅支持 association 关联对象和 collection 关联集合对象的延迟加载，association 指的就是一对一，collection 指的就是一对多查询。在 MyBatis 配置文件中，可以配置是否启用延迟加载 `lazyLoadingEnabled=true|false。`

## MyBatis 的 xml 映射文件中，不同的 xml 映射文件，id 是否可以重复？

注：我出的。

答：不同的 xml 映射文件，id 可以重复。

原因就是 namespace+id 是作为 `Map<String, MappedStatement>` 的 key 使用的，如果 namespace 不同，即使 id 重复，key (namespace+id) 也是不同的。

## MyBatis 都有哪些 Executor 执行器？它们之间的区别是什么？

MyBatis 有三种基本的 `Executor` 执行器：

- **`SimpleExecutor`：** 每执行一次 update 或 select，就开启一个 Statement 对象，用完立刻关闭 Statement 对象。
- **`ReuseExecutor`：** 执行 update 或 select，以 sql 作为 key 查找 Statement 对象，存在就使用，不存在就创建，用完后，不关闭 Statement 对象，而是放置于 Map<String, Statement>内，供下一次使用。简言之，就是重复使用 Statement 对象。
- **`BatchExecutor`**：执行 update（没有 select，JDBC 批处理不支持 select），将所有 sql 都添加到批处理中（addBatch()），等待统一执行（executeBatch()），它缓存了多个 Statement 对象，每个 Statement 对象都是 addBatch()完毕后，等待逐一执行 executeBatch()批处理。与 JDBC 批处理相同。

## 简述 MyBatis 的 xml 映射文件和 MyBatis 内部数据结构之间的映射关系？

注：我出的

答：MyBatis 将所有 xml 配置信息都封装到 All-In-One 重量级对象 Configuration 内部。在 xml 映射文件中， `<parameterMap>` 标签会被解析为 `ParameterMap` 对象，其每个子元素会被解析为 ParameterMapping 对象。 `<resultMap>` 标签会被解析为 `ResultMap` 对象，其每个子元素会被解析为 `ResultMapping` 对象。每一个 `<select>、<insert>、<update>、<delete>` 标签均会被解析为 `MappedStatement` 对象，标签内的 sql 会被解析为 BoundSql 对象。