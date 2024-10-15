node {
    def AWS_ACCOUNT_ID = '593664963477'
    def AWS_REGION = 'us-east-1'
    def ECR_REPOSITORY = 'my-node-app'
    def ECS_CLUSTER = 'NODEJS_CLUSTER'
    def ECS_SERVICE = 'FrontenNodjsAPP02'
    def TASK_DEFINITION = 'MyNodeApp'
    def ECR_REPOSITOR_URL = 'https://us-east-1.console.aws.amazon.com/ecr/private-registry/repositories?region=us-east-1'

    stage('Checkout') {
        // Checkout code from GitHub
        git url: 'https://github.com/Cyrilleoc/ECR_FARGATE.git', branch: 'Develop'
    }

    stage('Build Docker Image') {
        sh """
            aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
            docker build -t ${ECR_REPOSITORY}:latest .
        """
    }

    stage('Push Docker Image') {
        sh """
            docker tag ${ECR_REPOSITORY}:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:latest
            docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:latest
        """
    }

    stage('Deploy to ECS Fargate') {
        script {
            try {
                // Fetch the current task definition
                def taskDefJson = sh(script: "aws ecs describe-task-definition --task-definition ${TASK_DEFINITION}", returnStdout: true)

                // Parse the JSON response into a Groovy object
                def newTaskDef = readJSON(text: taskDefJson)

                // Define the new image
                def newImage = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:latest"

                // Update the image in the container definitions
                newTaskDef.taskDefinition.containerDefinitions.each { container ->
                    if (container.name == 'nodejs') { // Change 'nodejs' to your actual container name
                        container.image = newImage // Use the variable to set the image
                    }
                }

                // Create a minimal task definition for registration
                def simplifiedTaskDef = [
                    family: newTaskDef.taskDefinition.family,
                    taskRoleArn: newTaskDef.taskDefinition.taskRoleArn,
                    executionRoleArn: newTaskDef.taskDefinition.executionRoleArn,
                    networkMode: newTaskDef.taskDefinition.networkMode,
                    containerDefinitions: newTaskDef.taskDefinition.containerDefinitions,
                    volumes: newTaskDef.taskDefinition.volumes,
                    requiresCompatibilities: newTaskDef.taskDefinition.requiresCompatibilities,
                    cpu: newTaskDef.taskDefinition.cpu,
                    memory: newTaskDef.taskDefinition.memory,
                    tags: [] // Optional
                ]

                // Write the JSON to a temporary file
                def jsonFile = 'temp-task-def.json'
                writeJSON(file: jsonFile, json: simplifiedTaskDef)

                // Register the updated task definition
                def newTaskDefResponse = sh(script: "aws ecs register-task-definition --cli-input-json file://${jsonFile}", returnStdout: true)

                // Get the ARN of the new task definition
                def newTaskDefArn = readJSON(text: newTaskDefResponse).taskDefinition.taskDefinitionArn

                // Update the ECS service to use the new task definition
                sh "aws ecs update-service --cluster ${ECS_CLUSTER} --service ${ECS_SERVICE} --force-new-deployment --task-definition ${newTaskDefArn}"

                // Clean up the temporary file
                sh "rm -f ${jsonFile}"
            } catch (Exception e) {
                error("Deployment failed: ${e.getMessage()}")
            }
        }
    }
    post {
        always {
            // Clean up workspace after the pipeline finishes
            cleanWs()
        }
    }
}
