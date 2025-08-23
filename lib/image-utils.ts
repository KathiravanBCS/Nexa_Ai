export const onPickImages = (
  files: FileList | null,
  setImages: (images: { name: string; type: string; base64: string }[]) => void,
) => {
  if (!files) return

  const imagePromises: Promise<{ name: string; type: string; base64: string }>[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    imagePromises.push(
      new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e: any) => {
          resolve({
            name: file.name,
            type: file.type,
            base64: e.target.result.split(",")[1],
          })
        }
        reader.onerror = (error) => {
          reject(error)
        }
        reader.readAsDataURL(file)
      }),
    )
  }

  Promise.all(imagePromises)
    .then((newImages) => {
      setImages((prevImages) => [...prevImages, ...newImages])
    })
    .catch((error) => {
      console.error("Error reading images:", error)
    })
}
