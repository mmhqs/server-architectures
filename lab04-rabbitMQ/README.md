## Execution steps
List Service (Produtor) → RabbitMQ Exchange (shopping_events) → Consumers

Consumers:
- Consumer A (Notification Service)
- Consumer B (Analytics Service)

## Run Docker locally

`docker run -d --hostname my-rabbit --name rabbitmq -p 5673:5672 -p 15673:15672 rabbitmq:3-management`

RabbitMQ local interface: `http://localhost:15673`