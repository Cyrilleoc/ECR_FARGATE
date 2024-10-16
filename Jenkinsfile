pipeline {
    agent any 

    environment {
        AWS_ACCOUNT_ID = '593664963477'
        AWS_REGION = 'us-east-1'
        ECR_REPOSITORY = 'my-node-app'
        ECS_CLUSTER = 'NODEJS_CLUSTER'
        ECS_SERVICE = 'FrontenNodjsAPP02'
        TASK_DEFINITION = 'MyNodeApp'
        ECS_URL = 'https://us-east-1.console.aws.amazon.com/ecs/v2/clusters?region=us-east-1'
    }
    
    stages {
        stage('Checkout') {
            steps {
                git url: 'https://github.com/Cyrilleoc/ECR_FARGATE.git', branch: 'Develop'
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    sh "aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
                    sh "docker build -t ${ECR_REPOSITORY}:latest ."
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                script {
                    sh "docker tag ${ECR_REPOSITORY}:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:latest"
                    sh "docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:latest"
                }
            }
        }

        stage('Deploy to ECS Fargate') {
            steps {
                script {
                    def taskDefJson = sh(script: "aws ecs describe-task-definition --task-definition ${TASK_DEFINITION}", returnStdout: true).trim()
                    def taskDef = readJSON(text: taskDefJson).taskDefinition

                    taskDef.containerDefinitions.each { containerDef ->
                        containerDef.image = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:latest"
                    }

                    taskDef.remove('taskDefinitionArn')
                    taskDef.remove('revision')
                    taskDef.remove('status')
                    taskDef.remove('requiresAttributes')
                    taskDef.remove('compatibilities')
                    taskDef.remove('registeredAt')
                    taskDef.remove('registeredBy')

                    writeJSON file: 'updated-task-def.json', json: taskDef

                    def newTaskDefResponse = sh(script: "aws ecs register-task-definition --cli-input-json file://updated-task-def.json", returnStdout: true).trim()
                    def newTaskDefArn = readJSON(text: newTaskDefResponse).taskDefinition.taskDefinitionArn

                    sh "aws ecs update-service --cluster ${ECS_CLUSTER} --service ${ECS_SERVICE} --task-definition ${newTaskDefArn} --force-new-deployment"
                }
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
    }
}
