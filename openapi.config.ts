import { generateService } from '@umijs/openapi'

generateService({
  // schemaPath: 'http://101.200.240.100:5000/swagger.json', // 可以是.json文件，也可以是远程json地址
  schemaPath: 'http://127.0.0.1:5000/swagger.json',
  serversPath: './src/servers',
  requestLibPath: "import  request  from 'umi-request'", // 指定request的导入路径
})