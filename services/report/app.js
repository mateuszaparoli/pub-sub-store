const RabbitMQService = require('./rabbitmq-service')
const path = require('path')

require('dotenv').config({ path: path.resolve(__dirname, '.env') })

var report = {}
async function updateReport(products) {
    for(let product of products) {
        if(!product.name) {
            continue
        } else if(!report[product.name]) {
            report[product.name] = 1;
        } else {
            report[product.name]++;
        }
    }

}

async function printReport() {
    for (const [key, value] of Object.entries(report)) {
        console.log(`${key} = ${value} sales`);
      }
}

async function consume() {
    try {
        const service = await RabbitMQService.getInstance()
        // consume messages from queue 'report'
        await service.consume('report', async (msg) => {
            if (!msg) return
            try {
                const content = JSON.parse(msg.content.toString())
                // content is expected to be an object or an array of products
                if (Array.isArray(content)) {
                    await updateReport(content)
                } else if (content && content.products) {
                    await updateReport(content.products)
                } else {
                    // if the message itself is a product
                    await updateReport([content])
                }
                await printReport()
            } catch (err) {
                console.error('Failed to process message from report queue:', err.message)
            }
        })
        console.log('Report service is consuming messages from queue "report"')
    } catch (err) {
        console.error('Error connecting to RabbitMQ:', err.message)
        process.exit(1)
    }
} 

consume()
