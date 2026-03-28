import { execSync } from 'node:child_process'
import { homedir } from 'node:os'

const sshKey = `${homedir()}/.ssh/cabpart_ci`
const remote = 'jdrspace@ssh-jdrspace.alwaysdata.net'
const remotePath = '/home/jdrspace/www/moodboard'

console.log('Transfert dist/ vers Alwaysdata...')
execSync(
  `tar czf - -C dist . | ssh -i ${sshKey} -o IdentitiesOnly=yes ${remote} "rm -rf ${remotePath} && mkdir -p ${remotePath} && tar xzf - -C ${remotePath}"`,
  { stdio: 'inherit' }
)

console.log('Deployed successfully')
