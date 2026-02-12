const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'delivery-service',
    brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
});

const producer = kafka.producer();

const produceEvent = async (topic, message) => {
    try {
        await producer.connect();
        await producer.send({
            topic,
            messages: [{ value: JSON.stringify(message) }],
        });
    } catch (err) {
        console.error('Kafka produce error:', err);
        throw err;
    } finally {
        try {
            await producer.disconnect();
        } catch (e) {
            // ignore disconnect errors
        }
    }
};

module.exports = { produceEvent };