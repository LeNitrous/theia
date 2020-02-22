module.exports = {
    css: {
        loaderOptions: {
            scss: {
                prependData: "@import '@/variables.scss';"
            }
        }
    },
    pluginOptions: {
        electronBuilder: {
            builderOptions: {
                appId: "com.Nitrous.Theia",
                productName: "Theia",
                extraResources: "scripts"
            }
        }
    }
}