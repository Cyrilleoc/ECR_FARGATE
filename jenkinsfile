pipeline {
    agent any 

    environment {
        AWS_ACCOUNT_ID = 593664963477 // Change to your AWS account ID
        AWS_REGION = 'us-east-1' // Change to your AWS region
        ECR_REPOSITORY = 'my-node-app' // Change to your ECR repository
        ECS_CLUSTER = 'NODEJS_CLUSTER' // Change to your ECS cluster name
        ECS_SERVICE = 'FrontenNodjsAPP02' // Change to your ECS service name
        TASK_DEFINITION = 'MyNodeApp' // Change to your task definition name
    }
    
    stages {
        stage('Checkout') {
            steps {
                git url: 'https://github.com/Cyrilleoc/ECR_FARGATE.git', branch: 'develop' // Change to your git repository
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    // Login to AWS ECR
                    sh "aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

                    // Build the Docker image
                    sh 'docker build -t ${ECR_REPOSITORY}:latest .'
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                script {
                    // Tag and push the Docker image to ECR
                    sh "docker tag ${ECR_REPOSITORY}:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:latest"
                    sh "docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:latest"
                }
            }
        }

        stage('Deploy to ECS Fargate') {
            steps {
                script {
                    // Register the new task definition with the latest image
                    def taskDefJson = sh(script: "aws ecs describe-task-definition --task-definition ${TASK_DEFINITION}", returnStdout: true)
                    def newTaskDef = readJSON(text: taskDefJson)

                    // Update image in task definition
                    def containerDefinitions = newTaskDef.taskDefinition.containerDefinitions.collect {
                        it.image = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:latest"
                        return it
                    }

                    newTaskDef.taskDefinition.containerDefinitions = containerDefinitions
                    newTaskDef = newTaskDef.taskDefinition
                    newTaskDef.taskDefinitionArn = null // Remove current task definition ARN

                    // Register new task definition
                    def newTaskDefResponse = sh(script: "aws ecs register-task-definition --cli-input-json '${newTaskDef}'", returnStdout: true)
                    def newTaskDefArn = readJSON(text: newTaskDefResponse).taskDefinition.taskDefinitionArn

                    // Update service to use new task definition
                    sh "aws ecs update-service --cluster ${ECS_CLUSTER} --service ${ECS_SERVICE} --force-new-deployment --task-definition ${newTaskDefArn}"
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
